import { concat, defer, from, of, type Observable } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { craftTransaction } from "@ledgerhq/coin-evm/logic/craftTransaction";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import { getCryptoCurrencyById } from "../../../../currencies";
import { runSignTransactionEvm } from "../shared/signTransactionEvm";
import type { QuoteApprovalTransaction } from "../../quotes/types";
import type { SignApprovalEvmIntentInput, SignApprovalEvmJobState } from "./types";

/**
 * RLP-encode the approval payload from a swap quote into the unsigned legacy
 * EVM transaction hex expected by `SignerEth.signTransaction`. Quotes always
 * carry an explicit `gasPrice` + `gasLimit`, so we feed them straight into
 * `craftTransaction` as `customFees` and let coin-evm own the encoding
 * (no direct ethers import here).
 */
async function buildUnsignedApprovalTxHex(
  currency: CryptoCurrency,
  approvalTransaction: QuoteApprovalTransaction,
  senderAddress: string,
): Promise<string> {
  const calldataHex = approvalTransaction.calldata.replace(/^0x/, "");
  const data = calldataHex.length > 0 ? Buffer.from(calldataHex, "hex") : Buffer.alloc(0);

  const { transaction } = await craftTransaction(currency, {
    // The intent shape comes from `@ledgerhq/coin-module-framework`; use
    // the craftTransaction parameter type rather than adding a direct dep.
    transactionIntent: {
      intentType: "transaction",
      type: "send-legacy",
      // `craftTransaction` derives the nonce from `transactionIntent.sender`
      // (see coin-evm/logic/craftTransaction.ts). Use the signing account's
      // address rather than the quote-blob `from` so a stale quote / account
      // switch can't desync the nonce from the actual signer.
      sender: senderAddress,
      recipient: approvalTransaction.to,
      amount: BigInt(approvalTransaction.value || "0"),
      asset: { type: "native" },
      data: { type: "buffer", value: data },
    } satisfies Parameters<typeof craftTransaction>[1]["transactionIntent"],
    customFees: {
      value: 0n,
      parameters: {
        gasLimit: BigInt(approvalTransaction.gasLimit || "100000"),
        gasPrice: BigInt(approvalTransaction.gasPrice),
      },
    },
  });

  return transaction;
}

function runSignApproval(
  connectionResult: DeviceConnectionResult,
  input: SignApprovalEvmIntentInput,
): Observable<SignApprovalEvmJobState> {
  const currency = getCryptoCurrencyById(input.currencyId);
  return from(
    buildUnsignedApprovalTxHex(currency, input.approvalTransaction, input.account.freshAddress),
  ).pipe(
    switchMap(unsignedTxHex =>
      runSignTransactionEvm(
        connectionResult,
        unsignedTxHex,
        input.derivationPath,
        "Sign approval failed",
      ),
    ),
    catchError(err =>
      of<SignApprovalEvmJobState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}

/**
 * Job for the approval signing intent.
 *
 * Emits an initial `preparing` state synchronously so the executor never
 * renders the intent component with `jobState: undefined`. All errors are
 * surfaced as a terminal `failed` value rather than an observable error, so
 * the orchestrator can read them via `onIntentJobStateChanged` before
 * reacting in `onIntentJobComplete`.
 */
export const signApprovalEvmJob: Job<SignApprovalEvmJobState, SignApprovalEvmIntentInput> = ({
  deviceConnectionResult,
  input,
}) =>
  concat(
    of<SignApprovalEvmJobState>({ type: "preparing" }),
    defer(() => runSignApproval(deviceConnectionResult, input)),
  );
