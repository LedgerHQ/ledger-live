import { boolParser } from "@ledgerhq/live-env";

const teamEngagement = {
  SKIP_ONBOARDING: {
    def: false,
    parser: boolParser,
    desc: "dev flag to skip onboarding flow",
  },
  ANALYTICS_CONSOLE: {
    def: false,
    parser: boolParser,
    desc: "Show tracking overlays on the app UI",
  },
} as const;

export default teamEngagement;
