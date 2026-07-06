import { Account, TokenAccount } from "../enum/Account";
import { DeviceLabels } from "../enum/DeviceLabels";
import { runCliGetAddress } from "../runCli";
import { getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { Transaction } from "../models/Transaction";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export const sendConcordium = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      await getSendEvents(tx);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

const CCD_TESTNET_WALLET_PROXY_URL = "https://ccd-wallet-proxy-testnet.coin.ledger-test.com";
const CCD_WALLET_PROXY_TIMEOUT_MS = 10_000;

// Concordium addresses are not derived from BIP32 paths — they come from on-chain
// credential deployment. Resolve via wallet-proxy from the device-exported public key.
async function resolveCcdAddressFromPublicKey(publicKey: string): Promise<string> {
  const res = await fetch(`${CCD_TESTNET_WALLET_PROXY_URL}/v0/keyAccounts/${publicKey}`, {
    signal: AbortSignal.timeout(CCD_WALLET_PROXY_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `[CCD] Wallet-proxy error ${res.status} ${res.statusText} for public key ${publicKey.slice(0, 16)}...`,
    );
  }
  const accounts = await res.json();
  if (!accounts?.length) {
    throw new Error(`No on-chain accounts found for public key ${publicKey}`);
  }
  return accounts[0].address;
}

export async function getCcdAccountAddress(account: Account | TokenAccount): Promise<string> {
  const { publicKey } = await runCliGetAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
  });
  return resolveCcdAddressFromPublicKey(publicKey);
}
