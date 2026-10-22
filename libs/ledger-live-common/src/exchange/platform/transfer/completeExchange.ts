import { secp256k1 } from "@noble/curves/secp256k1.js";
import { firstValueFrom, from, Observable } from "rxjs";
import { WrongDeviceForAccount } from "@ledgerhq/ledger-wallet-framework/errors";

import { delay } from "../../../promise";
import {
  createExchange,
  ExchangeTypes,
  isExchangeTypeNg,
  PayloadSignatureComputedFormat,
} from "@ledgerhq/hw-app-exchange";
import { getAccountCurrency, getMainAccount } from "../../../account";
import { getAccountBridge } from "../../../bridge";
import { TransactionRefusedOnDevice } from "../../../errors";
import { withDevice } from "../../../hw/deviceAccess";
import { getCurrencyExchangeConfig } from "../..";
import { convertToAppExchangePartnerKey, getProviderConfig } from "../../providers";

import type {
  CompleteExchangeInputFund,
  CompleteExchangeInputSell,
  CompleteExchangeRequestEvent,
  ConfirmExchangeCallbacks,
  ConfirmExchangeSequence,
} from "../types";
import type Transport from "@ledgerhq/hw-transport";
import type { Transaction } from "../../../coin-modules/transaction-types";
import { CompleteExchangeError, CompleteExchangeStep, convertTransportError } from "../../error";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

export type ConfirmTransferExchangeInput = CompleteExchangeInputFund | CompleteExchangeInputSell;

/**
 * Has the Exchange app check the payout address, which is when it shows the review. `0x6a83`
 * means the account does not belong to the connected device.
 */
async function validatePayoutAddress(
  exchange: ReturnType<typeof createExchange>,
  { config, signature }: Awaited<ReturnType<typeof getCurrencyExchangeConfig>>,
  addressParameters: Buffer,
): Promise<void> {
  try {
    await exchange.validatePayoutOrAsset(config, signature, addressParameters);
  } catch (e) {
    const transportErr = e as { name?: string; statusCode?: number } | null | undefined;
    if (transportErr?.name === "TransportStatusError" && transportErr?.statusCode === 0x6a83) {
      throw new WrongDeviceForAccount();
    }

    throw convertTransportError("CHECK_PAYOUT_ADDRESS", e);
  }
}

/**
 * Builds the Exchange app confirmation sequence for a sell or fund: partner key, payload,
 * signature, payout address check, then `signCoinTransaction`.
 *
 * It runs against whatever {@link Transport} `run` is given, so the legacy `withDevice` path and
 * the Device Intent job share it. It never closes the transport.
 */
export function createTransferConfirmSequence(
  input: ConfirmTransferExchangeInput,
  { isCancelled, onConfirmationRequested }: ConfirmExchangeCallbacks,
): ConfirmExchangeSequence {
  let { transaction } = input; // TODO build a tx from the data

  const {
    exchange: transferExchange,
    provider,
    binaryPayload,
    signature,
    exchangeType,
    rateType, // TODO Pass fixed/float for UI switch ?
  } = input;

  const { fromAccount, fromParentAccount } = transferExchange;

  let ignoreTransportError = false;
  let currentStep: CompleteExchangeStep = "INIT";

  const run = async (transport: Transport): Promise<void> => {
    const providerNameAndSignature = await getProviderConfig(exchangeType, provider);

    if (!providerNameAndSignature)
      throw new CompleteExchangeError(
        "INIT",
        "ProviderConfigError",
        "Could not get provider infos",
      );

    const exchange = createExchange(
      transport,
      exchangeType,
      rateType,
      providerNameAndSignature.version,
    );

    const mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const accountBridge = await getAccountBridge(mainAccount);
    const mainPayoutCurrency = getAccountCurrency(mainAccount);
    const payoutCurrency = getAccountCurrency(fromAccount);

    if (mainPayoutCurrency.type !== "CryptoCurrency")
      throw new CompleteExchangeError(
        "INIT",
        "InvalidCurrencyType",
        `This should be a cryptocurrency, got ${mainPayoutCurrency.type}`,
      );

    transaction = await accountBridge.prepareTransaction(mainAccount, transaction);
    if (isCancelled()) return;

    const { errors, estimatedFees } = await accountBridge.getTransactionStatus(
      mainAccount,
      transaction,
    );
    if (isCancelled()) return;

    const errorsKeys = Object.keys(errors);
    if (errorsKeys.length > 0) {
      const firstKey = errorsKeys[0];
      const validationError = errors[firstKey];
      throw new CompleteExchangeError(
        currentStep,
        firstKey,
        validationError.message ||
          validationError.name ||
          `Transaction validation failed: ${firstKey}`,
      );
    }

    currentStep = "SET_PARTNER_KEY";
    await exchange.setPartnerKey(convertToAppExchangePartnerKey(providerNameAndSignature));
    if (isCancelled()) return;

    currentStep = "CHECK_PARTNER";
    await exchange.checkPartner(providerNameAndSignature.signature!);
    if (isCancelled()) return;

    currentStep = "PROCESS_TRANSACTION";

    const { payload, format } = buildProcessTransactionPayload(
      exchange.transactionType,
      binaryPayload,
    );

    await exchange.processTransaction(payload, estimatedFees, format);
    if (isCancelled()) return;

    const goodSign = convertSignature(signature, exchange.transactionType);

    currentStep = "CHECK_TRANSACTION_SIGNATURE";
    await exchange.checkTransactionSignature(goodSign);
    if (isCancelled()) return;

    const payoutAddressParameters = accountBridge.getSerializedAddressParameters(mainAccount);
    if (isCancelled()) return;
    if (!payoutAddressParameters) {
      throw new CompleteExchangeError(
        currentStep,
        "UnsupportedFamily",
        `Family not supported: ${mainPayoutCurrency.family}`,
      );
    }

    const payoutAddressConfig = await getCurrencyExchangeConfig(payoutCurrency);
    if (isCancelled()) return;

    onConfirmationRequested(estimatedFees.toString());
    currentStep = "CHECK_PAYOUT_ADDRESS";
    await validatePayoutAddress(exchange, payoutAddressConfig, payoutAddressParameters);

    if (isCancelled()) return;
    ignoreTransportError = true;
    currentStep = "SIGN_COIN_TRANSACTION";
    await exchange.signCoinTransaction();
  };

  // Maps what `run` threw, and swallows what a successful confirmation produces (see below).
  const handleError = (e: unknown): void => {
    // `signCoinTransaction` makes the Exchange app hand over to the coin app, which can drop the
    // link before answering: that is the expected end of the confirmation, not a failure.
    if (ignoreTransportError) return;

    const transportErr = e as { name?: string; statusCode?: number } | null | undefined;
    if (
      transportErr?.name === "TransportStatusError" &&
      (transportErr?.statusCode === 0x6a84 || transportErr?.statusCode === 0x5501)
    ) {
      throw new TransactionRefusedOnDevice();
    }

    // Preserve known error types checked by .name downstream
    const eName = (e as { name?: string })?.name;
    if (eName === "CompleteExchangeError") throw e;
    if (eName === "WrongDeviceForAccount" || eName === "TransactionRefusedOnDevice") throw e;
    // Wrap any remaining unknown errors with the current step context
    const unknownError = e as { name?: string; message?: string } | null | undefined;
    throw new CompleteExchangeError(
      currentStep,
      unknownError?.name,
      unknownError?.message || "Unknown exchange error",
    );
  };

  return { run, handleError, getTransaction: () => transaction };
}

/**
 * Runs the sell or fund confirmation on an already opened transport and resolves with the
 * fee-prepared transaction to sign.
 */
export async function confirmTransferExchange(
  input: ConfirmTransferExchangeInput,
  { transport, ...callbacks }: ConfirmExchangeCallbacks & { transport: Transport },
): Promise<Transaction> {
  const sequence = createTransferConfirmSequence(input, callbacks);
  await sequence.run(transport).catch(sequence.handleError);
  return sequence.getTransaction();
}

const completeExchange = (
  input: CompleteExchangeInputFund | CompleteExchangeInputSell,
): Observable<CompleteExchangeRequestEvent> => {
  const { deviceId } = input;

  return new Observable(o => {
    let unsubscribed = false;

    const sequence = createTransferConfirmSequence(input, {
      isCancelled: () => unsubscribed,
      onConfirmationRequested: estimatedFees => {
        o.next({ type: "complete-exchange-requested", estimatedFees });
      },
    });

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, transport => sequence.run(transport)).catch(
        sequence.handleError,
      );
      await delay(3000);
      o.next({
        type: "complete-exchange-result",
        completeExchangeResult: sequence.getTransaction(),
      });
      if (unsubscribed) return;
    };

    confirmExchange().then(
      () => {
        o.complete();
        unsubscribed = true;
      },
      e => {
        o.next({
          type: "complete-exchange-error",
          error: e,
        });
        o.complete();
        unsubscribed = true;
      },
    );
    return () => {
      unsubscribed = true;
    };
  });
};

/**
 * For the Fund and Swap flow, the signature sent to the nano needs to
 * be in DER format, which is not the case for Sell flow. Hence the
 * ternary.
 * cf. https://github.com/LedgerHQ/app-exchange/blob/e67848f136dc7227521791b91f608f7cd32e7da7/src/check_tx_signature.c#L14-L32
 * @param {Buffer} bufferSignature
 * @param {ExchangeTypes} exchangeType
 * @return {Buffer} The correct format Buffer for AppExchange call.
 */
function convertSignature(signature: string, exchangeType: ExchangeTypes): Buffer {
  if (isExchangeTypeNg(exchangeType)) {
    const base64Signature = signature.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64Signature, "base64");
  }

  const sigHex = Buffer.from(signature, "hex");

  if (exchangeType === ExchangeTypes.Sell) return sigHex;

  // Signature may arrive as hex (128 chars = 64 bytes) or as base64url from providers
  const sigBytes =
    sigHex.length === 64
      ? sigHex
      : Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  const sig = secp256k1.Signature.fromBytes(sigBytes, "compact");
  return Buffer.from(sig.toBytes("der"));
}

/**
 * All legacy paths (Sell and Fund) receive `binaryPayload` as a hex-encoded string.
 * For Fund: hex-decoding yields the raw base64url string bytes that the firmware
 * then base64-decodes internally before running pb_decode (see process_transaction.c).
 * For Sell: hex-decoding yields the raw protobuf bytes directly.
 * @param transactionType
 * @param binaryPayload
 * @returns
 */
function buildProcessTransactionPayload(
  transactionType: ExchangeTypes,
  binaryPayload: string,
): { payload: Buffer; format: PayloadSignatureComputedFormat } {
  if (isExchangeTypeNg(transactionType)) {
    return { payload: Buffer.from("." + binaryPayload), format: "jws" };
  }

  return { payload: Buffer.from(binaryPayload, "hex"), format: "raw" };
}

export default completeExchange;
