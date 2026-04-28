import packageJson from "../package.json";

export type WalletCliReleaseChannel = "stable" | "prerelease";

const DEFAULT_RELEASE_CHANNEL: WalletCliReleaseChannel = "prerelease";

export function resolveWalletCliReleaseChannel(
  value: string | undefined,
): WalletCliReleaseChannel {
  return value === "stable" || value === "prerelease" ? value : DEFAULT_RELEASE_CHANNEL;
}

const { version } = packageJson as { version?: string };

if (!version) {
  throw new Error('Missing "version" in wallet-cli package.json');
}

export const WALLET_CLI_VERSION = version;
export const WALLET_CLI_RELEASE_CHANNEL = resolveWalletCliReleaseChannel(
  process.env.WALLET_CLI_RELEASE_CHANNEL,
);
