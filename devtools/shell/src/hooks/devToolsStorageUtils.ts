export const STORAGE_KEY = "devtools:state";

export type DevToolsPersistedState = {
  activeToolId?: string | null;
};

export function serialize(state: DevToolsPersistedState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): DevToolsPersistedState {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "object" && parsed !== null && "activeToolId" in parsed) {
    if (typeof parsed.activeToolId === "string" || parsed.activeToolId === null) {
      return { activeToolId: parsed.activeToolId };
    }
  }
  return {};
}
