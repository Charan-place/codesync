import { useId, useState } from 'react';

export function Field({
  label,
  value,
  onChange,
  type,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  hint?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <label htmlFor={id} className="block text-sm">
      <span className="text-slate-300 font-medium">{label}</span>
      <div
        className={`mt-1.5 rounded-lg border bg-slate-900/60 transition-all duration-200 ${
          focused ? 'border-brand-500 shadow-[0_0_0_3px_rgba(59,107,245,0.18)]' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px bg-slate-800 flex-1" />
      <span className="text-xs text-slate-500">{label}</span>
      <div className="h-px bg-slate-800 flex-1" />
    </div>
  );
}
