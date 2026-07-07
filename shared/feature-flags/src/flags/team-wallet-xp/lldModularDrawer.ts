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
  {
    description:
      "Enables the Modular Asset Drawer on Desktop — the unified asset/network selection drawer " +
      "shared across the add-account, receive, send and Live App flows.",
    status: "rollout",
    owner: "wallet-xp",
    paramsDoc: {
      add_account: "Use the modular drawer in the add-account flow.",
      live_app: "Use the modular drawer when triggered from a Live App.",
      live_apps_allowlist: "Live App manifest ids explicitly allowed to use the modular drawer.",
      live_apps_blocklist: "Live App manifest ids explicitly blocked from the modular drawer.",
      receive_flow: "Use the modular drawer in the receive flow.",
      send_flow: "Use the modular drawer in the send flow.",
      enableModularization: "Master switch for the modularization refactor behind the drawer.",
      searchDebounceTime: "Debounce in ms applied to the drawer's asset search input.",
      backendEnvironment: "Which backend environment the drawer queries (e.g. \"PROD\").",
      enableDialogDesktop: "Render the drawer as a desktop dialog instead of a side drawer.",
    },
  },
);
