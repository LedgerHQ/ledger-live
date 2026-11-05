const STATE_HOME_VARS = ["XDG_STATE_HOME", "LOCALAPPDATA"] as const;

/** Points `stateDir()` at `dir` on every platform (Windows reads `LOCALAPPDATA`, not
 * `XDG_STATE_HOME`), and returns the function that restores the previous values. */
export function pointStateHomeAt(dir: string): () => void {
  const saved = STATE_HOME_VARS.map(name => [name, process.env[name]] as const);
  for (const name of STATE_HOME_VARS) process.env[name] = dir;
  return () => {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
}
