import { z } from "zod";
import { flagWith } from "../../define";

export const lldModularDrawer = flagWith(
  {
    add_account: z.boolean(),
    live_app: z.boolean(),
    live_apps_allowlist: z.array(z.string()),
    live_apps_blocklist: z.array(z.string()),
    receive_flow: z.boolean(),
    send_flow: z.boolean(),
    enableModularization: z.boolean(),
    searchDebounceTime: z.number(),
    backendEnvironment: z.string(),
    enableDialogDesktop: z.boolean().optional(),
  },
  {
    enabled: false,
    params: {
      add_account: true,
      live_app: true,
      live_apps_allowlist: [],
      live_apps_blocklist: [],
      receive_flow: true,
      send_flow: true,
      enableModularization: false,
      searchDebounceTime: 500,
      backendEnvironment: "PROD",
      enableDialogDesktop: false,
    },
  },
);
