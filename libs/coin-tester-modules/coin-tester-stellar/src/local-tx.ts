import BigNumber from "bignumber.js";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { HORIZON_URL } from "./fixtures";

/**
 * Side-channel helpers that drive set-up transactions (pre-funded recipient
 * trustlines, issuer→test token payments) against the local Stellar Quickstart
 * Horizon.
 *
 * These deliberately go straight through `@stellar/stellar-sdk` rather than
 * coin-stellar's craft / combine / broadcast pipeline. This is test *scaffolding*,
 * not the code under test: routing it through coin-stellar coupled the fixtures
 * to the very module we're validating and, worse, surfaced coin-stellar's own
 * failure modes (e.g. `networkDown`) as opaque setup errors. Talking to Horizon
 * directly keeps the setup path independent of the bridge.
 *
 * The local Quickstart is configured with the PUBLIC network passphrase, so we
 * sign and build against {@link Networks.PUBLIC} to match.
 */

const server = new Horizon.Server(HORIZON_URL, { allowHttp: true });

/** Stellar amounts are expressed in whole units; 1 XLM / asset unit = 1e7 stroops. */
function stroopsToUnits(stroops: bigint): string {
  return new BigNumber(stroops.toString()).dividedBy(1e7).toFixed(7);
}

async function signAndSubmit(
  seed: Uint8Array,
  build: (builder: TransactionBuilder) => TransactionBuilder,
): Promise<void> {
  const keypair = Keypair.fromRawEd25519Seed(Buffer.from(seed));
  const source = await server.loadAccount(keypair.publicKey());
  const transaction = build(
    new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    }),
  )
    .setTimeout(30)
    .build();
  transaction.sign(keypair);
  await server.submitTransaction(transaction);
}

/**
 * Have `accountAddress` (signed in-process with `accountSeed`) create a
 * trustline to `assetCode` issued by `assetIssuer`. Required before the
 * account can hold or receive that asset.
 */
export async function createTrustline({
  accountSeed,
  assetCode,
  assetIssuer,
}: {
  accountSeed: Uint8Array;
  assetCode: string;
  assetIssuer: string;
}): Promise<void> {
  await signAndSubmit(accountSeed, builder =>
    builder.addOperation(Operation.changeTrust({ asset: new Asset(assetCode, assetIssuer) })),
  );
}

/**
 * Send `amountStroops` of `assetCode` issued by `issuerAddress` from the
 * issuer's own account to `recipientAddress`. The recipient must already have a
 * trustline; otherwise the payment fails with `op_no_trust`.
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
  await signAndSubmit(issuerSeed, builder =>
    builder.addOperation(
      Operation.payment({
        destination: recipientAddress,
        asset: new Asset(assetCode, issuerAddress),
        amount: stroopsToUnits(amountStroops),
      }),
    ),
  );
}
