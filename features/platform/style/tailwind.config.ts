import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ledgerhq/lumen-design-core";

const config = {
  presets: [ledgerLivePreset],
} satisfies Config;

export default config;
