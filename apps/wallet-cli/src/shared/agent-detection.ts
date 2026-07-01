// Single source of truth for "which AI agent is invoking this CLI", derived from
// the same env signals used by @bunli/plugin-ai-detect. Keeps detection logic in
// one place so isAgentEnvironment() and the first-run nudge stay in sync.

import type { SupportedAgent } from "../skills/registry";

export type AgentDetection = {
  /** True when any known agent env signal is present. */
  detected: boolean;
  /**
   * A valid `skill install --agent` value whenever an agent is detected — a
   * specific agent (e.g. "claude"), or the generic "agents" bucket
   * (-> .agents/skills) for agents without a dedicated directory (Gemini CLI /
   * opencode / amp). Null only when no agent signal is present.
   */
  agent: SupportedAgent | null;
  /** Human-readable name for messaging (falls back to a generic phrase). */
  label: string;
};

/**
 * Detect the calling AI agent from the environment.
 *
 * When an agent is detected, `agent` is always a value accepted by
 * `skill install --agent` — either a specific agent or the generic "agents"
 * bucket. It is null only when no known agent env signal is present (in which
 * case `detected` is false too), and callers fall back to generic messaging.
 */
export function detectAgent(): AgentDetection {
  const env = process.env;

  if (env.CLAUDECODE || env.CLAUDE_CODE) {
    return { detected: true, agent: "claude", label: "Claude Code" };
  }
  if (env.CURSOR_AGENT) {
    return { detected: true, agent: "cursor", label: "Cursor" };
  }
  if (env.CODEX_ENABLED) {
    return { detected: true, agent: "codex", label: "Codex" };
  }
  if (env.GEMINI_CLI) {
    return { detected: true, agent: "agents", label: "Gemini CLI" };
  }
  if (env.OPENCODE) {
    return { detected: true, agent: "agents", label: "opencode" };
  }
  if (env.AMP_CURRENT_THREAD_ID || env.AGENT === "amp") {
    return { detected: true, agent: "agents", label: "amp" };
  }

  return { detected: false, agent: null, label: "your AI agent" };
}
