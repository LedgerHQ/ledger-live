import { homedir } from "node:os";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";

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

export type StateHomeEnv = Record<(typeof STATE_HOME_VARS)[number], string>;

export function stateHomeEnv(dir: string): StateHomeEnv {
  return { XDG_STATE_HOME: dir, LOCALAPPDATA: dir };
}

export function cliStateDirIn(stateHome: string): string {
  return stateDir(APP_NAME, {
    platform: process.platform,
    env: stateHomeEnv(stateHome),
    homedir: homedir(),
  });
}
