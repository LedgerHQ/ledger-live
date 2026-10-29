// OpenClaw installs a plugin from git only when package.json names a runtime entry in
// openclaw.extensions. This plugin ships skills only (openclaw.plugin.json lists them), so the
// entry registers nothing.
export default {
  id: "ledger-wallet-cli",
  name: "Ledger Wallet CLI",
  description: "Skills-only plugin; no runtime capabilities.",
  register() {},
};
