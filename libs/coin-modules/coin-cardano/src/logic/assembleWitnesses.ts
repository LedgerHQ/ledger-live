import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import { Transaction as TyphonTransaction, types as TyphonTypes } from "@stricahq/typhonjs";
import type { Witness } from "../signer";

/**
 * Attach the device's witnesses to an unsigned Typhon transaction and build it.
 *
 * The Cardano device returns one witness per signing path — payment input path(s) plus the stake
 * path for a delegation/withdrawal (a staking tx needs both the payment-key and stake-key witnesses,
 * per the cardano-ledger UTXOW rule). Each witness carries only the signature; the public key is
 * derived from the account extended key by the path's chain/index to form the vkey witness. Shared by
 * the legacy bridge and the CoinModule (Alpaca) signing path (the eventual witness-array-aware
 * framework signer can lift this unchanged).
 */
export function assembleWitnesses(
  unsignedTransaction: TyphonTransaction,
  accountKey: Bip32PublicKey,
  witnesses: Array<Witness>,
): ReturnType<TyphonTransaction["buildTransaction"]> {
  witnesses.forEach(witness => {
    const [, , , chainType, index] = witness.path;
    const publicKey = accountKey.derive(chainType).derive(index).toPublicKey().toBytes();
    const vKeyWitness: TyphonTypes.VKeyWitness = {
      signature: Buffer.from(witness.witnessSignatureHex, "hex"),
      publicKey: Buffer.from(publicKey),
    };
    unsignedTransaction.addWitness(vKeyWitness);
  });

  return unsignedTransaction.buildTransaction();
}
