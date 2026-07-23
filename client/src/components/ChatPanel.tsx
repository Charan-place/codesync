import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from '../types';

export default function ChatPanel({ messages, onSend }: { messages: ChatMessage[]; onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && <p className="text-xs text-slate-500">No messages yet. Say hello 👋</p>}
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-brand-500">{m.senderName}</span>
            <span className="text-slate-500 text-xs ml-2">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <p className="text-slate-200">{m.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the room…"
          className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-sm hover:bg-brand-700">Send</button>
      </form>
    </div>
  );
}
