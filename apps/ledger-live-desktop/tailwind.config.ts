import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ledgerhq/ldls-design-core";

const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@ledgerhq/ldls-ui-react/dist/lib/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [ledgerLivePreset],
} satisfies Config;

export default config;
