import { Psbt } from "bitcoinjs-lib";
import type {
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { buildSyncedAccount, deriveAccountMeta } from "./buildAccount";
import { buildKnownAddressDerivationsMap } from "../knownAddressDerivations";
import { buildCandidateTx } from "./buildCandidateTx";
import { feePerByteOverride, resolveFeePerByte } from "./feeRate";

/**
 * Craft an unsigned Bitcoin transaction as a base64 PSBT, ready for the app-bitcoin-new device
 * signer.
 *
 * Coin-selects the account's UTXOs (via {@link buildCandidateTx}) and serializes them into a PSBT:
 * legacy inputs carry `nonWitnessUtxo` (the previous tx); segwit inputs carry `witnessUtxo`
 * (script + value) plus `nonWitnessUtxo` for maximal device compatibility. Outputs carry their
 * script and value.
 *
 * **Wallet policy** — app-bitcoin-new does not read PSBT `bip32Derivation`; it signs from
 * `accountPath` + `addressFormat` + a `knownAddressDerivations` map. Those are produced here and
 * returned in `details` for the device-signing step. NOTE (ADR-032, unresolved): the generic
 * consumer today — `generic-coin-framework/signOperation.ts` — calls `signer.signTransaction(path,
 * unsigned, opts)` with only the derivation path and the unsigned PSBT, and does NOT thread these
 * `details` to the signer. So Bitcoin's wallet-policy signing is not yet wired end-to-end; closing
 * it (routing `details` to the device signer, or re-deriving the policy from the PSBT) is the open
 * ADR-032 integration task — it lives in the generic framework / signer contract, not here.
 *
 * Note: wrapped-segwit (`p2sh`) inputs additionally need a `redeemScript`, and Taproot needs
 * `tapInternalKey`/`tapBip32Derivation` — added when those script types are validated on-device.
 */
export async function craftTransaction(
  _context: BitcoinContext,
  currencyId: string,
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  // Bitcoin is a descriptor chain: `sender` carries the xpub, `senderDerivationPath` locates the
  // account (script type + index). The generic framework populates both.
  const derivationPath = intent.senderDerivationPath;
  const meta = deriveAccountMeta(derivationPath);
  const account = await buildSyncedAccount(currencyId, intent.sender, derivationPath);
  // A user-provided fee rate (sat/vB, in customFees.parameters.feePerByte) overrides the
  // network-estimated rate; both estimateFees and craftTransaction resolve it the same way so the
  // crafted tx pays exactly what estimateFees quoted.
  const feePerByte =
    feePerByteOverride(customFees?.parameters) ?? (await resolveFeePerByte(account));
  const txInfo = await buildCandidateTx(
    account,
    intent.recipient,
    intent.amount,
    feePerByte,
    intent.useAllAmount,
  );
  const isSegwit = meta.addressFormat !== "legacy";

  const psbt = new Psbt();
  for (const input of txInfo.inputs) {
    if (!input.output_hash || !input.address) {
      throw new Error(
        "craftTransaction: selected input is missing its previous tx hash or address",
      );
    }
    const nonWitnessUtxo = Buffer.from(input.txHex, "hex");
    if (isSegwit) {
      psbt.addInput({
        hash: input.output_hash,
        index: input.output_index,
        sequence: input.sequence,
        witnessUtxo: {
          script: account.xpub.crypto.toOutputScript(input.address),
          value: Number(input.value),
        },
        nonWitnessUtxo,
      });
    } else {
      psbt.addInput({
        hash: input.output_hash,
        index: input.output_index,
        sequence: input.sequence,
        nonWitnessUtxo,
      });
    }
  }
  for (const output of txInfo.outputs) {
    psbt.addOutput({ script: output.script, value: output.value.toNumber() });
  }

  const knownAddressDerivations = await buildKnownAddressDerivationsMap(account, meta.accountPath);

  return {
    transaction: psbt.toBase64(),
    details: {
      fee: txInfo.fee,
      accountPath: meta.accountPath,
      addressFormat: meta.addressFormat,
      knownAddressDerivations,
      associatedDerivations: txInfo.associatedDerivations,
    },
  };
}
