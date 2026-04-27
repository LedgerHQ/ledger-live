export const STORAGE_KEY = "devtools:state";

export const MAX_RECENT_TOOLS = 4;

export type DevToolsPersistedState = {
  activeToolId?: string | null;
  recentToolIds?: string[];
};

export function serialize(state: DevToolsPersistedState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): DevToolsPersistedState {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return {};

  const result: DevToolsPersistedState = {};

  if ("activeToolId" in parsed) {
    if (typeof parsed.activeToolId === "string" || parsed.activeToolId === null) {
      result.activeToolId = parsed.activeToolId;
    }
  }

  if ("recentToolIds" in parsed && Array.isArray(parsed.recentToolIds)) {
    result.recentToolIds = parsed.recentToolIds.filter(
      (id): id is string => typeof id === "string",
    );
  }

  return result;
}

export function addToRecent(recentToolIds: string[], toolId: string): string[] {
  if (recentToolIds[0] === toolId) return recentToolIds;
  return [toolId, ...recentToolIds.filter(id => id !== toolId)].slice(0, MAX_RECENT_TOOLS);
}
