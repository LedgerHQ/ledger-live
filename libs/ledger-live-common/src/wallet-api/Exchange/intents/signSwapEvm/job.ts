import { concat, defer, from, of, type Observable } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { craftTransaction } from "@ledgerhq/coin-evm/logic/craftTransaction";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import { getCryptoCurrencyById } from "../../../../currencies";
import { runSignTransactionEvm } from "../shared/signTransactionEvm";
import type { DexTransactionData } from "../../dex";
import type { SignSwapEvmIntentInput, SignSwapEvmJobState } from "./types";

/**
 * RLP-encode the DEX-provided swap calldata into the unsigned EVM
 * transaction hex expected by `SignerEth.signTransaction`. DEX builders
 * only supply `to / data / value / gasLimit`; we feed those to
 * `craftTransaction` and let coin-evm pull EIP-1559 fee data from the node
 * (mirroring `walletAPI.transaction.signAndBroadcast` in the live-app).
 */
async function buildUnsignedSwapTxHex(
  currency: CryptoCurrency,
  account: Account,
  transactionData: DexTransactionData,
): Promise<string> {
  const calldataHex = transactionData.data.replace(/^0x/, "");
  const data = calldataHex.length > 0 ? Buffer.from(calldataHex, "hex") : Buffer.alloc(0);

  const { transaction } = await craftTransaction(currency, {
    transactionIntent: {
      intentType: "transaction",
      type: "send-eip1559",
      sender: account.freshAddress,
      recipient: transactionData.to,
      amount: BigInt(transactionData.value || "0"),
      asset: { type: "native" },
      data: { type: "buffer", value: data },
      feesStrategy: "medium",
    } satisfies Parameters<typeof craftTransaction>[1]["transactionIntent"],
    customFees: {
      value: 0n,
      // Only gasLimit is pinned — `craftTransaction` fetches `maxFeePerGas`
      // and `maxPriorityFeePerGas` from the node when fee params are missing.
      parameters: { gasLimit: BigInt(transactionData.gasLimit) },
    },
  });

  return transaction;
}

function runSignSwap(
  connectionResult: DeviceConnectionResult,
  input: SignSwapEvmIntentInput,
): Observable<SignSwapEvmJobState> {
  const currency = getCryptoCurrencyById(input.currencyId);
  return from(buildUnsignedSwapTxHex(currency, input.account, input.transactionData)).pipe(
    switchMap(unsignedTxHex =>
      runSignTransactionEvm(
        connectionResult,
        unsignedTxHex,
        input.derivationPath,
        "Sign swap failed",
      ),
    ),
    catchError(err =>
      of<SignSwapEvmJobState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}

/**
 * Job for the swap signing intent.
 *
 * Mirrors {@link signApprovalEvmJob} so the orchestration can reuse the
 * same state machine: emits an initial `preparing` value synchronously,
 * surfaces device-driven progress as the DMK signer does, and converts
 * errors into a terminal `failed` state instead of an observable error.
 */
export const signSwapEvmJob: Job<SignSwapEvmJobState, SignSwapEvmIntentInput> = ({
  deviceConnectionResult,
  input,
}) =>
  concat(
    of<SignSwapEvmJobState>({ type: "preparing" }),
    defer(() => runSignSwap(deviceConnectionResult, input)),
  );
