import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import {
  isSegwitDerivationMode,
  getAddressFormatDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import type { AccountBridge, DerivationMode, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Transaction } from "./types";
import { getNetworkParameters } from "./networks";
import { buildTransaction } from "./buildTransaction";
import { calculateFees } from "./cache";
import wallet, { getWalletAccount } from "./wallet-btc";
import { perCoinLogic } from "./logic";
import { SignerContext } from "./signer";
import { feeFromPsbtBase64 } from "./psbtFees";

export const buildSignRawOperation =
  (signerContext: SignerContext): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { currency } = account;
        const walletAccount = getWalletAccount(account);

        log("hw", `signTransaction ${currency.id} for account ${account.id}`);
        const txInfo = await buildTransaction(account, transaction);

        // Pre-compute (used by regular flow and as fallback in PSBT flow)
        let senders = new Set<string>();
        let recipients: string[] = [];
        let fee = new BigNumber(0);

        const feesRes = await calculateFees({ account, transaction });
        senders = new Set(feesRes.txInputs.map(i => i.address).filter(Boolean) as string[]);
        recipients = feesRes.txOutputs
          .filter(o => o.address && !o.isChange)
          .map(o => o.address) as string[];
        fee = feesRes.fees;

        let lockTime: number | undefined;

        // (legacy) Set lockTime for Komodo to enable reward claiming on UTXOs created by
        // Ledger Live. We should only set this if the currency is Komodo and
        // lockTime isn't already defined.
        if (currency.id === "komodo" && lockTime === undefined) {
          const unixtime = Math.floor(Date.now() / 1000);
          lockTime = unixtime - 777;
        }

        const networkParams = getNetworkParameters(currency.id);
        const sigHashType = networkParams.sigHash;
        if (isNaN(sigHashType)) {
          throw new Error("sigHashType should not be NaN");
        }

        const segwit = isSegwitDerivationMode(account.derivationMode as DerivationMode);

        const perCoin = perCoinLogic[currency.id];
        let additionals: string[] = [currency.id];

        if (account.derivationMode === "native_segwit") {
          additionals.push("bech32");
        }

        if (account.derivationMode === "taproot") {
          additionals.push("bech32m");
        }

        if (perCoin?.getAdditionals) {
          additionals = additionals.concat(
            perCoin.getAdditionals({
              transaction,
            }),
          );
        }

        const expiryHeight = perCoin?.hasExpiryHeight
          ? Buffer.from([0x00, 0x00, 0x00, 0x00])
          : undefined;
        const hasExtraData = perCoin?.hasExtraData || false;

        // -------- PSBT path --------
        if (transaction.psbt) {
          // Emit "requested" for UI parity with regular flow
          o.next({ type: "device-signature-requested" });

          // Decode & validate base64 PSBT
          let psbtBuffer: Buffer;
          try {
            psbtBuffer = Buffer.from(transaction.psbt, "base64");
          } catch {
            throw new Error("Invalid PSBT: not valid base64");
          }
          if (!psbtBuffer.length) {
            throw new Error("Invalid PSBT: empty buffer");
          }

          const psbtResult = await signerContext(deviceId, currency, signer =>
            signer.signPsbtV2Buffer
              ? signer.signPsbtV2Buffer(psbtBuffer, {
                  finalizePsbt: Boolean(transaction.finalizePsbt),
                  accountPath: `${walletAccount.params.path}/${walletAccount.params.index}'`,
                  addressFormat: getAddressFormatDerivationMode(account.derivationMode),
                })
              : Promise.reject(new Error("signPsbtV2Buffer not available")),
          );

          if (!psbtResult) {
            // TODO: find proper name, also, do we want to really throw here or handle it differently
            throw new Error("Invalid PSBT: couldn't sign");
          }

          o.next({ type: "device-signature-granted" });

          // Prefer fee computed from the PSBT itself, fall back to calculated fee
          const psbtFee = feeFromPsbtBase64(transaction.psbt) || fee;

          // Optimistic operation for PSBT (we don't know recipients/amount here)
          const operation: Operation = {
            id: encodeOperationId(account.id, "", "OUT"),
            hash: "",
            type: "OUT",
            // Keep value coherent with fee (real value will be reconciled at sync)
            value: psbtFee,
            fee: psbtFee,
            blockHash: null,
            blockHeight: null,
            senders: [],
            recipients: [],
            accountId: account.id,
            date: new Date(),
            extra: { psbt: true },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              // Ensure non-empty signature: if not finalized, fall back to the PSBT (base64)
              signature: psbtResult.tx || psbtResult.psbt.toString("base64"),
              rawData: { psbtSigned: psbtResult.psbt.toString("base64") },
            },
          });
          return;
        }

        // -------- Regular (non-PSBT) flow --------
        const signature: string = await signerContext(deviceId, currency, signer =>
          wallet.signAccountTx({
            btc: signer,
            fromAccount: walletAccount,
            txInfo,
            lockTime,
            sigHashType,
            segwit,
            additionals,
            expiryHeight,
            hasExtraData,
            onDeviceSignatureGranted: () =>
              o.next({
                type: "device-signature-granted",
              }),
            onDeviceSignatureRequested: () =>
              o.next({
                type: "device-signature-requested",
              }),
            onDeviceStreaming: ({ progress, index, total }) =>
              o.next({
                type: "device-streaming",
                progress,
                index,
                total,
              }),
          }),
        );

        const operation: Operation = {
          id: encodeOperationId(account.id, "", "OUT"),
          hash: "", // Will be resolved in broadcast()
          type: "OUT",
          value: new BigNumber(transaction.amount).plus(fee),
          fee,
          blockHash: null,
          blockHeight: null,
          senders: Array.from(senders),
          recipients,
          accountId: account.id,
          date: new Date(),
          extra: {},
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignRawOperation;
