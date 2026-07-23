import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react';
import { YjsMonacoBinding } from '../utils/yjsMonacoBinding';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useVideoCall } from '../hooks/useVideoCall';
import ChatPanel from '../components/ChatPanel';
import ParticipantsBar from '../components/ParticipantsBar';
import VideoChat from '../components/VideoChat';
import { getRoom, verifyRoomPassword, executeCode } from '../api/rooms';
import type { Room as RoomType } from '../types';

export default function Room() {
  const { slug = '' } = useParams();
  const [room, setRoom] = useState<RoomType | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const { connected, participants, self, messages, joinError, sendChat, changeRole, doc, awareness, socket } =
    useRoomSocket(slug);

  const [inCall, setInCall] = useState(false);
  const { localStream, remoteStreams, mediaError } = useVideoCall(socket, slug, inCall);

  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const bindingRef = useRef<YjsMonacoBinding | null>(null);

  // Only JavaScript actually executes right now (see server/executeController.ts).
  // Other languages still get real syntax highlighting in the editor, but Run
  // is disabled for them so it's obvious why nothing happens instead of
  // silently trying to run Python/etc. as JavaScript.
  const RUNNABLE_LANGUAGES = new Set(['javascript']);
  const LANGUAGE_OPTIONS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'plaintext', label: 'Plain text' },
  ];

  useEffect(() => {
    getRoom(slug)
      .then((r) => {
        setRoom(r);
        if (r.hasPassword) setNeedsPassword(true);
        else setUnlocked(true);
      })
      .catch(() => setRoom(null));
  }, [slug]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    try {
      await verifyRoomPassword(slug, passwordInput);
      setUnlocked(true);
      setNeedsPassword(false);
    } catch {
      setPasswordError('Incorrect password');
    }
  }

  const handleMount: OnMount = (editor) => {
    const yText = doc.getText('monaco');
    bindingRef.current = new YjsMonacoBinding(yText, editor.getModel()!);
    void awareness; // presence/cursor color data is still tracked for the participants bar
  };

  useEffect(() => {
    return () => bindingRef.current?.destroy();
  }, []);

  async function handleRun() {
    if (!RUNNABLE_LANGUAGES.has(language)) {
      setOutput({
        stdout: '',
        stderr: `Running "${language}" isn't supported yet — only JavaScript executes right now. ` +
          'Switch the language dropdown to JavaScript to use Run.',
      });
      return;
    }
    setRunning(true);
    setOutput(null);
    try {
      const code = doc.getText('monaco').toString();
      const result = await executeCode(slug, language, code);
      setOutput(result);
    } catch (err: any) {
      setOutput({ stdout: '', stderr: err.response?.data?.error || 'Execution failed' });
    } finally {
      setRunning(false);
    }
  }

  if (joinError) {
    return <div className="min-h-screen flex items-center justify-center text-red-400">{joinError}</div>;
  }

  if (needsPassword && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-3">
          <h1 className="text-lg font-semibold">This room is password-protected</h1>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Room password"
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium hover:bg-brand-700">Unlock</button>
        </form>
      </div>
    );
  }

  const readOnly = self?.role === 'viewer';
  const isEditable = !readOnly;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold">CodeSync</span>
          <span className="text-slate-500 text-sm">{room?.title || 'Untitled room'} · /{slug}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'}`}>
            {connected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {!RUNNABLE_LANGUAGES.has(opt.value) ? ' (view only)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleRun}
            disabled={running}
            title={!RUNNABLE_LANGUAGES.has(language) ? 'Only JavaScript can be executed right now' : undefined}
            className="text-sm rounded-md bg-brand-600 px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60"
          >
            {running ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            options={{ readOnly: !isEditable, minimap: { enabled: false }, fontSize: 14 }}
            onMount={handleMount}
          />
          {output && (
            <div className="h-40 border-t border-slate-800 bg-slate-950 overflow-y-auto p-3 text-sm font-mono">
              {output.stdout && <pre className="text-slate-200 whitespace-pre-wrap">{output.stdout}</pre>}
              {output.stderr && <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>}
              {!output.stdout && !output.stderr && <span className="text-slate-500">No output</span>}
            </div>
          )}
        </div>

        <aside className="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col">
          <ParticipantsBar participants={participants} self={self} onChangeRole={changeRole} />
          <VideoChat
            inCall={inCall}
            onToggle={() => setInCall((v) => !v)}
            localStream={localStream}
            remoteStreams={remoteStreams}
            mediaError={mediaError}
          />
          <div className="flex-1 min-h-0">
            <ChatPanel messages={messages} onSend={sendChat} />
          </div>
        </aside>
      </div>
    </div>
  );
}
