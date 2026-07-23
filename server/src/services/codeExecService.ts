import vm from 'node:vm';
import { env } from '../config/env';

export interface ExecResult {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

// Runs untrusted JS in a fresh V8 context with no Node globals (no require,
// process, fs, network). Captures console output, enforces a wall-clock
// timeout, and truncates output to keep responses small.
export async function runSandboxed(code: string): Promise<ExecResult> {
  const logs: string[] = [];
  const errors: string[] = [];
  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map(safeStringify).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(safeStringify).join(' ')),
  };

  const context = vm.createContext({ console: sandboxConsole });
  let timedOut = false;

  try {
    const script = new vm.Script(code, { filename: 'user-code.js' });
    script.runInContext(context, { timeout: env.codeExecTimeoutMs });
  } catch (err: any) {
    if (err?.message?.includes('Script execution timed out')) {
      timedOut = true;
    } else {
      errors.push(err?.message || String(err));
    }
  }

  return {
    stdout: truncate(logs.join('\n')),
    stderr: truncate(errors.join('\n')),
    timedOut,
  };
}

function safeStringify(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function truncate(s: string, max = 4000): string {
  return s.length > max ? s.slice(0, max) + '\n…(truncated)' : s;
}
