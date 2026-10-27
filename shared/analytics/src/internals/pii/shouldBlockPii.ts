declare const process: { env: { NODE_ENV?: string } };

const BLOCKING_ENVIRONMENTS = new Set(["development", "test"]);

export function shouldBlockPii(): boolean {
  try {
    return BLOCKING_ENVIRONMENTS.has(process.env.NODE_ENV ?? "");
  } catch {
    return false;
  }
}
