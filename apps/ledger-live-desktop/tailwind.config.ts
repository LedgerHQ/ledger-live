import type { Config } from "tailwindcss";
import { ledgerLivePreset } from "@ldls/design-core";

const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Your project's files
    "./node_modules/@ldls/ui-react/dist/lib/**/*.{js,ts,jsx,tsx}" // Ledger UI Kit components
  ],
  presets: [ledgerLivePreset], // the installed tailwind preset
} satisfies Config;

export default config;
