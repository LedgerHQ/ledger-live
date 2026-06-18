import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import { broadcast, combine, craftTransaction } from "@ledgerhq/coin-stellar/logic";

/**
 * Side-channel helpers that drive set-up transactions (pre-funded recipient
 * trustlines, issuer→test token payments) through the SAME coin-stellar
 * craft / combine / broadcast pipeline the bridge uses. The only piece we
 * stand in for is the device: signing is done in-process with a local
 * ed25519 seed.
 *
 * Why we go through the coin module rather than calling stellar-sdk
 * directly: any divergence between the test fixtures and the production
 * craft/sign/broadcast code would mask regressions in coin-stellar itself —
 * which is the whole point of the coin tester.
 *
 * `coinConfig.setCoinConfig({ explorer.url, ... })` must be called BEFORE
 * any of the helpers below so the underlying `loadAccount` / `submitTransaction`
 * calls hit the local Stellar Quickstart instance.
 */

const DEFAULT_FEE = 100n;

/**
 * Stellar tx hash = SHA256(signatureBase). The hardware wallet computes that
 * hash internally before signing; we mirror it here so the signature lines up
 * with what `combine()` will verify against `Transaction.hash()`.
 */
function signSignatureBase(seed: Uint8Array, signatureBaseB64: string): string {
  const payload = Buffer.from(signatureBaseB64, "base64");
  const hash = sha256(payload);
  const signature = ed25519.sign(hash, seed);
  return Buffer.from(signature).toString("base64");
}

async function craftSignAndSubmit({
  account,
  transaction,
  seed,
}: {
  account: { address: string };
  transaction: Parameters<typeof craftTransaction>[1];
  seed: Uint8Array;
}): Promise<string> {
  const crafted = await craftTransaction(account, transaction);
  const signatureB64 = signSignatureBase(seed, crafted.signatureBase);
  const signedXdr = combine(crafted.xdr, signatureB64, account.address);
  return broadcast(signedXdr);
}

/**
 * Have `accountAddress` (signed in-process with `accountSeed`) create a
 * trustline to `assetCode` issued by `assetIssuer`. Required before the
 * account can hold or receive that asset.
 */
export async function createTrustline({
  accountAddress,
  accountSeed,
  assetCode,
  assetIssuer,
}: {
  accountAddress: string;
  accountSeed: Uint8Array;
  assetCode: string;
  assetIssuer: string;
}): Promise<void> {
  await craftSignAndSubmit({
    account: { address: accountAddress },
    transaction: {
      type: "changeTrust",
      recipient: assetIssuer,
      amount: 0n,
      fee: DEFAULT_FEE,
      assetCode,
      assetIssuer,
    },
    seed: accountSeed,
  });
}

/**
 * Send `amount` (in stroops) of `assetCode` issued by `issuerAddress` from
 * the issuer's own account to `recipientAddress`. The recipient must already
 * have a trustline; otherwise the payment fails with `op_no_trust`.
 */
export async function sendIssuerPayment({
  issuerAddress,
  issuerSeed,
  recipientAddress,
  assetCode,
  /** Amount in stroops (1 XLM = 1e7 stroops). */
  amountStroops,
}: {
  issuerAddress: string;
  issuerSeed: Uint8Array;
  recipientAddress: string;
  assetCode: string;
  amountStroops: bigint;
}): Promise<void> {
  await craftSignAndSubmit({
    account: { address: issuerAddress },
    transaction: {
      type: "send",
      recipient: recipientAddress,
      amount: amountStroops,
      fee: DEFAULT_FEE,
      assetCode,
      assetIssuer: issuerAddress,
    },
    seed: issuerSeed,
  });
}
