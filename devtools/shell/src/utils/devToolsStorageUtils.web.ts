import type { ToolId } from "@devtools/registry";

export const STORAGE_KEY = "devtools:state";

export const MAX_RECENT_TOOLS = 4;

export type DevToolsPersistedState = {
  activeToolId?: ToolId | null;
  recentToolIds?: ToolId[];
};

export function serialize(state: DevToolsPersistedState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): DevToolsPersistedState {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return {};

  const result: DevToolsPersistedState = {};

  if ("activeToolId" in parsed) {
    if (typeof parsed.activeToolId === "string") {
      result.activeToolId = parsed.activeToolId;
    } else if (parsed.activeToolId === null) {
      result.activeToolId = null;
    }
  }

  if ("recentToolIds" in parsed && Array.isArray(parsed.recentToolIds)) {
    result.recentToolIds = parsed.recentToolIds.filter(
      (id): id is ToolId => typeof id === "string",
    );
  }

  return result;
}

export function addToRecent(recentToolIds: ToolId[], toolId: ToolId): ToolId[] {
  if (recentToolIds[0] === toolId) return recentToolIds;
  return [toolId, ...recentToolIds.filter(id => id !== toolId)].slice(0, MAX_RECENT_TOOLS);
}
