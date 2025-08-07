import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ldls/design-core";

const config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./.storybook/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.stories.{js,jsx,ts,tsx}",
    "../../libs/ui-rnative/dist/**/*.{js,jsx,ts,tsx}",
    "../../libs/ui-rnative/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset"), ledgerLivePreset],
} satisfies Config;

export default config;
