import { Account, TokenAccount } from "../enum/Account";
import { DeviceLabels } from "../enum/DeviceLabels";
import { runCliGetAddress } from "../runCli";
import { pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export const sendConcordium = withDeviceController(({ getButtonsController }) => async () => {
  const buttons = getButtonsController();

  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
    await longPressAndRelease(DeviceLabels.SIGN_TRANSACTION, 3);
  } else {
    // Concordium screen flow: Transaction Type → Amount → Fee → Destination → Account → Accept → Sign transaction
    await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
    await buttons.both();
  }
});

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
