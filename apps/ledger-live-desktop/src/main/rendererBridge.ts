import { app } from "electron";
import type { Bootstrap } from "~/bridge/contract";

// The main build's ~/renderer/bridge, for the shared Datadog modules: only their bootstrap reads.
export const bootstrap: Pick<Bootstrap, "env" | "paths"> = {
  env: process.env,
  paths: { userData: app.getPath("userData"), home: app.getPath("home") },
};
