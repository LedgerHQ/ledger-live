/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@ledgerhq/ldls-ui-rnative/src/**/*.{js,jsx,ts,tsx}",
    "./apps/ledger-live-mobile/node_modules/@ledgerhq/ldls-ui-rnative/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
