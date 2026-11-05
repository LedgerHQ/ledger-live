const STATE_HOME_VARS = ["XDG_STATE_HOME", "LOCALAPPDATA"] as const;

/** Points `stateDir()` at `dir`; Windows reads `LOCALAPPDATA`, not `XDG_STATE_HOME`. */
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

export function stateHomeEnv(dir: string): Record<string, string> {
  return Object.fromEntries(STATE_HOME_VARS.map(name => [name, dir]));
}
