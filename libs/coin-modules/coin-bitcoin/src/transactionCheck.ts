// Payload of the web3checks transaction check for Bitcoin: the built transaction is sent as an
// unsigned PSBT. Posting it and reading the descriptor is generic, see
// @ledgerhq/ledger-wallet-framework/transactionCheck.
import { Psbt, Transaction as BtcTransaction } from "bitcoinjs-lib";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { Account, TransactionCheckPayload } from "@ledgerhq/types-live";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { DerivationModes, type TransactionInfo } from "@ledgerhq/wallet-btc/types";
import { calculateFees } from "./cache";
import type { BitcoinCoinConfig } from "./config";
import { sha256 } from "./crypto-util";
import { getWalletAccount } from "./getWalletAccount";
import type { Transaction } from "./types";

// Master fingerprints are zeroed: they are shared by every account of a seed and would link
// all of a user's transactions together.
const ZERO_FINGERPRINT = new Uint8Array(4);

type ScanPsbt = { psbt: Buffer; from: string };

type Derivation = Pick<Parameters<Psbt["addInput"]>[0], "bip32Derivation" | "tapBip32Derivation">;

async function getDerivation(
  walletAccount: WalletAccount,
  [account, index]: [number, number],
): Promise<Derivation> {
  const { xpub, params } = walletAccount;
  const pubkey = await xpub.crypto.getPubkeyAt(xpub.xpub, account, index);
  const path = `m/${params.path}/${params.index}'/${account}/${index}`;
  if (params.derivationMode === DerivationModes.TAPROOT) {
    const xOnly = pubkey.subarray(1, 33);
    return {
      tapBip32Derivation: [
        { masterFingerprint: ZERO_FINGERPRINT, pubkey: xOnly, path, leafHashes: [] },
      ],
    };
  }
  return { bip32Derivation: [{ masterFingerprint: ZERO_FINGERPRINT, pubkey, path }] };
}

/**
 * Build the unsigned PSBT (v0) of a wallet-btc transaction, without any xpub.
 * `from` is the address of the first input, all inputs belonging to the account.
 */
export async function buildScanPsbt(
  walletAccount: WalletAccount,
  txInfo: TransactionInfo,
): Promise<ScanPsbt | null> {
  const from = txInfo.inputs[0]?.address;
  if (!from) return null;

  const { derivationMode } = walletAccount.params;
  const psbt = new Psbt({ network: walletAccount.xpub.crypto.network });

  for (const [i, input] of txInfo.inputs.entries()) {
    const derivation = txInfo.associatedDerivations[i];
    if (!input.output_hash || !derivation) return null;
    const prevTx = BtcTransaction.fromHex(input.txHex);
    const prevOut = prevTx.outs[input.output_index];
    if (!prevOut) return null;

    psbt.addInput({
      hash: input.output_hash,
      index: input.output_index,
      sequence: input.sequence,
      ...(derivationMode === DerivationModes.LEGACY
        ? { nonWitnessUtxo: Buffer.from(input.txHex, "hex") }
        : { witnessUtxo: { script: prevOut.script, value: BigInt(prevOut.value) } }),
      ...(await getDerivation(walletAccount, derivation)),
    });
  }

  for (const output of txInfo.outputs) {
    psbt.addOutput({
      script: output.script,
      value: BigInt(output.value.toFixed()),
      ...(output.isChange
        ? await getDerivation(walletAccount, [
            txInfo.changeAddress.account,
            txInfo.changeAddress.index,
          ])
        : {}),
    });
  }

  return { psbt: Buffer.from(psbt.toBuffer()), from };
}

/**
 * Build the PSBT that screens the recipient: the transaction spending the whole balance to it.
 * It can be built as soon as the recipient is entered, before any amount, and does not change
 * while the amount is typed, so the recipient is scanned once (the scan is cached by PSBT).
 * Returns null when the transaction cannot be built.
 */
export async function getTransactionCheckPayload(
  config: BitcoinCoinConfig,
  logger: Logger,
  account: Account,
  transaction: Transaction,
): Promise<TransactionCheckPayload | null> {
  try {
    const { walletTx } = await calculateFees(config, logger, {
      account,
      transaction: { ...transaction, useAllAmount: true },
    });
    const scan = await buildScanPsbt(getWalletAccount(account), walletTx);
    if (!scan) return null;
    return {
      chain: "bitcoin",
      from: scan.from,
      raw: scan.psbt.toString("base64"),
      txHash: sha256(scan.psbt).toString("hex"),
    };
  } catch (error) {
    logger("bitcoin", "transaction check payload unavailable", error);
    return null;
  }
}
