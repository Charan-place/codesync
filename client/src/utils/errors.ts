import { isAxiosError } from 'axios';

// Pulls a server-provided { error: string } message out of a caught request
// failure, without resorting to `catch (err: any)` at every call site.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}
