// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const path = require("path");

// Load desktop and mobile configs
const desktopConfig = require("../../apps/ledger-live-desktop/.eslintrc.js");
const mobileConfig = require("../../apps/ledger-live-mobile/.eslintrc.js");

module.exports = {
  // Use mobile config as base (most features use React Native)
  ...mobileConfig,
  overrides: [
    // Apply desktop config to .web files
    {
      files: ["**/*.web.{ts,tsx,js,jsx}"],
      ...desktopConfig,
      settings: {
        ...desktopConfig.settings,
        tailwindcss: {
          config: path.join(__dirname, "../../apps/ledger-live-desktop/tailwind.config.ts"),
          callees: ["cn"],
        },
      },
    },
    // Apply mobile config to .native files
    {
      files: ["**/*.native.{ts,tsx,js,jsx}"],
      ...mobileConfig,
    },
    // Preserve existing overrides from both configs
    ...(desktopConfig.overrides || []),
    ...(mobileConfig.overrides || []),
  ],
};
