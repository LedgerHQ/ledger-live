// Clears every ambient AI-agent signal that `detectAgent()` reads (e.g. CURSOR_AGENT is present in
// the real process.env when a suite runs inside Cursor), so a test can set exactly the one it wants.
export const CLEAR_AGENTS = {
  CLAUDECODE: "",
  CLAUDE_CODE: "",
  CURSOR_AGENT: "",
  CODEX_ENABLED: "",
  GEMINI_CLI: "",
  OPENCODE: "",
  AMP_CURRENT_THREAD_ID: "",
  AGENT: "",
};
