import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { YjsMonacoBinding } from '../utils/yjsMonacoBinding';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useVideoCall } from '../hooks/useVideoCall';
import ChatPanel from '../components/ChatPanel';
import ParticipantsBar from '../components/ParticipantsBar';
import VideoChat from '../components/VideoChat';
import { getRoom, verifyRoomPassword, executeCode } from '../api/rooms';
import type { Room as RoomType } from '../types';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { Field } from '../components/ui/Input';
import { getErrorMessage } from '../utils/errors';

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      toast.success('Room link copied to clipboard!');
    } catch {
      toast.error('Could not copy link.');
    }
  }

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
    } catch (err: unknown) {
      setOutput({ stdout: '', stderr: getErrorMessage(err, 'Execution failed') });
    } finally {
      setRunning(false);
    }
  }

  if (joinError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <Logo size="lg" />
        <p className="text-red-400 mt-4">{joinError}</p>
        <Link to="/" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
          Back to home
        </Link>
      </div>
    );
  }

  if (needsPassword && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/15 blur-[110px]" />
        </div>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleUnlock}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl space-y-4"
        >
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <h1 className="text-lg font-semibold text-center">This room is password-protected</h1>
          <Field label="Password" value={passwordInput} onChange={setPasswordInput} type="password" />
          <AnimatePresence>
            {passwordError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400"
              >
                {passwordError}
              </motion.p>
            )}
          </AnimatePresence>
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </motion.form>
      </div>
    );
  }

  const readOnly = self?.role === 'viewer';
  const isEditable = !readOnly;

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <header className="glass flex items-center justify-between px-4 py-2.5 border-b border-white/5 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <span className="text-slate-400 text-sm truncate hidden sm:inline">
            {room?.title || 'Untitled room'} · /{slug}
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full transition-colors ${
              connected ? 'bg-emerald-600/15 text-emerald-400' : 'bg-amber-600/15 text-amber-400'
            }`}
          >
            <motion.span
              className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
              animate={connected ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {connected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            Copy link
          </Button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-shadow"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {!RUNNABLE_LANGUAGES.has(opt.value) ? ' (view only)' : ''}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleRun}
            loading={running}
            title={!RUNNABLE_LANGUAGES.has(language) ? 'Only JavaScript can be executed right now' : undefined}
          >
            {running ? 'Running…' : '▶ Run'}
          </Button>
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
          <AnimatePresence>
            {output && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 160, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="border-t border-slate-800 bg-slate-950 overflow-y-auto p-3 text-sm font-mono"
              >
                {output.stdout && <pre className="text-slate-200 whitespace-pre-wrap">{output.stdout}</pre>}
                {output.stderr && <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>}
                {!output.stdout && !output.stderr && <span className="text-slate-500">No output</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col bg-slate-950/60">
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
