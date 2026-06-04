import type {
  FeeEstimation,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountPathString, getBipPathFromString, getExtendedPublicKeyFromHex } from "../logic";
import { getNetworkParameters } from "../networks";
import type { CardanoSigner } from "../signer";
import typhonSerializer from "../typhonSerializer";
import { assembleWitnesses } from "./assembleWitnesses";
import { buildUnsignedTransactionForSigning } from "./craftTransaction";

export type SignCoinModuleTransactionParams = {
  currency: CryptoCurrency;
  intent: TransactionIntent<StringMemo>;
  /** The account's address derivation path (single-address model), e.g. `1852'/1815'/0'/0/0`. */
  derivationPath: string;
  deviceId: string;
  signerContext: SignerContext<CardanoSigner>;
  customFees?: FeeEstimation;
  /** Invoked once the device is about to display the transaction (before the user-facing sign). */
  onDeviceSignatureRequested?: () => void;
};

/**
 * Sign a CoinModule (Alpaca) Cardano transaction on the Ledger device with ALL required witnesses.
 *
 * Cardano staking/withdrawal needs both a payment-key and a stake-key witness (cardano-ledger UTXOW
 * rule), which the generic single-signature combine cannot express. Here we build the unsigned tx
 * with the account's BIP paths attached, let the device sign every required path (it returns one
 * witness per path), fetch the account extended public key, and assemble the full witness set —
 * mirroring the legacy bridge but driven by a CoinModule intent. Returns the signed CBOR payload.
 */
export async function signCoinModuleTransaction({
  currency,
  intent,
  derivationPath,
  deviceId,
  signerContext,
  customFees,
  onDeviceSignatureRequested,
}: SignCoinModuleTransactionParams): Promise<{ signature: string } | null> {
  const accountIndex = getBipPathFromString(derivationPath).account;
  // The device returns only signatures keyed by path; the account extended pubkey (needed to form
  // the vkey witnesses) comes from the account path `purpose'/coin'/account'`.
  const accountPath = getAccountPathString(accountIndex);

  const unsignedTransaction = await buildUnsignedTransactionForSigning(
    currency,
    intent,
    derivationPath,
    customFees,
  );
  const signerTransaction = typhonSerializer(unsignedTransaction, accountIndex);
  const networkParams = getNetworkParameters(currency.id);

  const signed = await signerContext(deviceId, async signer => {
    const extendedPublicKey = await signer.getPublicKey(accountPath);
    onDeviceSignatureRequested?.();
    const signature = await signer.sign({ transaction: signerTransaction, networkParams });
    return { extendedPublicKey, signature };
  });
  // Defensive guard (parity with the generic signOperation): avoid dereferencing an empty result.
  // On-device rejection rejects the signerContext promise, so it throws above rather than landing here.
  if (!signed) {
    return null;
  }

  const accountKey = getExtendedPublicKeyFromHex(
    `${signed.extendedPublicKey.publicKeyHex}${signed.extendedPublicKey.chainCodeHex}`,
  );
  const { payload } = assembleWitnesses(unsignedTransaction, accountKey, signed.signature.witnesses);
  return { signature: payload };
}
