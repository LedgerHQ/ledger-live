import { setEnv } from "@shared/env";
import { writeStderr } from "./ui";

/** `null` unless an http(s) URL live-common can append paths to, as the quote token goes there. */
export function parseSwapApiBase(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || url.username !== "" || url.password !== "") return null;
  if (/[?#]/.test(value)) return null;
  let swapApiBase = value;
  while (swapApiBase.endsWith("/")) swapApiBase = swapApiBase.slice(0, -1);
  return swapApiBase;
}

/** `setEnv` until LIVE-36894: live-common's swap execute and status read the same definition. */
export function applySwapApiBaseOverride(env: Readonly<Record<string, string | undefined>>): void {
  if (!env.SWAP_API_BASE) return;
  const swapApiBase = parseSwapApiBase(env.SWAP_API_BASE);
  if (swapApiBase === null) {
    writeStderr(
      "Error: SWAP_API_BASE must be an http(s) URL without user:pass@, query or fragment.\n",
    );
    process.exit(1);
  }
  setEnv("SWAP_API_BASE", swapApiBase);
  writeStderr(`⚠ Swap API set by SWAP_API_BASE: ${swapApiBase}\n`);
}
