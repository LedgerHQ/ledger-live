import Config from "react-native-config";
import { resolveWalletSyncEnvironment } from "@features/platform-wallet-sync";

export const walletSyncEnvironment = resolveWalletSyncEnvironment(Config.WALLET_SYNC_ENVIRONMENT);
