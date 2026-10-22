import pkg from "../../package.json" with { type: "json" };

export const walletCliVersion = pkg.version;

export const ledgerClientVersion = `wallet-cli/${walletCliVersion}`;
