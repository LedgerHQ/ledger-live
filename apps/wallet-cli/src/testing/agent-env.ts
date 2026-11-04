const AGENT_ENV_VARS = [
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CURSOR_AGENT",
  "CODEX_ENABLED",
  "GEMINI_CLI",
  "OPENCODE",
  "AMP_CURRENT_THREAD_ID",
  "AGENT",
] as const;

/** Makes `detectAgent()` see Claude Code, or no agent at all. Returns the restore function. */
export function setAgentEnvironment(agent: "claude" | "none"): () => void {
  const saved = AGENT_ENV_VARS.map(name => [name, process.env[name]] as const);
  for (const name of AGENT_ENV_VARS) delete process.env[name];
  if (agent === "claude") process.env.CLAUDECODE = "1";
  return () => {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
}
