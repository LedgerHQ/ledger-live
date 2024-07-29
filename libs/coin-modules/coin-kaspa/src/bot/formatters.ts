import { getContext } from "./bot-test-context";

export function formatError(e: unknown, longform = false): string {
  let out = "";
  if (!e || typeof e !== "object") {
    out = String(e);
  } else if (e instanceof Error) {
    const ctx = getContext(e);
    if (ctx) out += `TEST ${ctx}\n`;
    out += String(e);
  } else {
    try {
      out = "raw object: " + JSON.stringify(e);
    } catch (_e) {
      out = String(e);
    }
  }
  if (longform) {
    return out.slice(0, 500);
  }
  return out.replace(/[`]/g, "").replace(/\n/g, " ").slice(0, 200);
}
