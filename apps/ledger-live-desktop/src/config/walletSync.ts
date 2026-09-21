import { resolveWalletSyncEnvironment } from "@features/platform-wallet-sync";

export const walletSyncEnvironment = resolveWalletSyncEnvironment(
  process.env.WALLET_SYNC_ENVIRONMENT,
);
