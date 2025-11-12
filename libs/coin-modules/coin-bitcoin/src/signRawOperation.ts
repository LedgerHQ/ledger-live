import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { getAddressFormatDerivationMode } from "@ledgerhq/coin-framework/derivation";
import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Transaction } from "./types";
import { getNetworkParameters } from "./networks";
import { calculateFees } from "./cache";
import { getWalletAccount } from "./wallet-btc";
import { SignerContext } from "./signer";
import { feeFromPsbtBase64 } from "./psbtFees";
import { craftPsbtTransaction } from "./craftTransaction";

export const buildSignRawOperation =
  (signerContext: SignerContext): AccountBridge<Transaction>["signRawOperation"] =>
  ({ account, deviceId, transaction: psbt }) =>
    new Observable(o => {
      async function main() {
        const { currency } = account;
        const walletAccount = getWalletAccount(account);

        log("hw", `signRawTransaction ${currency.id} for account ${account.id}`);

        // Pre-compute (used by regular flow and as fallback in PSBT flow)
        let senders = new Set<string>();
        let recipients: string[] = [];
        let fee = new BigNumber(0);

        // const txInfo = craftPsbtTransaction({ psbt });

        // const feesRes = await calculateFees({ account, transaction: txInfo });
        // senders = new Set(feesRes.txInputs.map(i => i.address).filter(Boolean) as string[]);
        // recipients = feesRes.txOutputs
        //   .filter(o => o.address && !o.isChange)
        //   .map(o => o.address) as string[];
        // fee = feesRes.fees;

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

        // Emit "requested" for UI parity with regular flow
        o.next({ type: "device-signature-requested" });

        // Decode & validate base64 PSBT
        let psbtBuffer: Buffer;
        try {
          psbtBuffer = Buffer.from(psbt, "base64");
        } catch {
          throw new Error("Invalid PSBT: not valid base64");
        }
        if (!psbtBuffer.length) {
          throw new Error("Invalid PSBT: empty buffer");
        }

        const psbtResult = await signerContext(deviceId, currency, signer =>
          signer.signPsbtV2Buffer
            ? signer.signPsbtV2Buffer(psbtBuffer, {
                // finalizePsbt: Boolean(transaction.finalizePsbt), // TODO: add back when we have a way to get the finalizePsbt
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
        const psbtFee = feeFromPsbtBase64(psbt) || BigNumber(0);

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
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignRawOperation;
