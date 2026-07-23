import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { runSandboxed } from '../services/codeExecService';

// NOTE: Only JavaScript is executed locally via an isolated vm context with a
// timeout, CPU/output caps, and no access to Node built-ins (no require/fs/net).
// This is adequate for short demo snippets but is NOT a substitute for a real
// container-based sandbox before allowing untrusted, high-volume production
// traffic — see PLAN.md open decision on Judge0/Piston for that hardening step.
export async function executeCode(req: AuthedRequest, res: Response) {
  const { language, code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  if (language !== 'javascript') {
    return res.status(400).json({
      error: `Execution for "${language}" isn't wired up yet. Only javascript runs locally; ` +
        'other languages are planned to route through a hosted sandbox provider.',
    });
  }
  const result = await runSandboxed(code);
  res.json(result);
}
