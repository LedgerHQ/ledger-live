import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { firstValueFrom, from, Observable } from "rxjs";
import secp256k1 from "secp256k1";
import { convertToAppExchangePartnerKey, getCurrencyExchangeConfig } from "../";
import { getAccountCurrency, getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import { TransactionRefusedOnDevice } from "../../errors";
import perFamily from "../../generated/exchange";
import { withDevice } from "../../hw/deviceAccess";
import { delay } from "../../promise";
import { ExchangeTypes, createExchange, getExchangeErrorMessage } from "@ledgerhq/hw-app-exchange";
import type { CompleteExchangeInputSwap, CompleteExchangeRequestEvent } from "../platform/types";
import { getProviderConfig } from "./";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

const COMPLETE_EXCHANGE_LOG = "SWAP-CompleteExchange";

type CompleteExchangeStep =
  | "INIT"
  | "SET_PARTNER_KEY"
  | "CHECK_PARTNER"
  | "PROCESS_TRANSACTION"
  | "CHECK_TRANSACTION_SIGNATURE"
  | "CHECK_PAYOUT_ADDRESS"
  | "CHECK_REFUND_ADDRESS"
  | "SIGN_COIN_TRANSACTION";

export class SwapCompleteExchangeError extends Error {
  step: CompleteExchangeStep;

  constructor(step: CompleteExchangeStep, message?: string) {
    super(message);
    this.name = "SwapCompleteExchangeError";
    this.step = step;
  }
}

function convertTransportError(
  step: CompleteExchangeStep,
  err: unknown,
): SwapCompleteExchangeError | unknown {
  if (err instanceof TransportStatusError) {
    const errorMessage = getExchangeErrorMessage(err.statusCode, step);
    return new SwapCompleteExchangeError(step, errorMessage);
  }
  return err;
}

const completeExchange = (
  input: CompleteExchangeInputSwap,
): Observable<CompleteExchangeRequestEvent> => {
  let { transaction } = input; // TODO build a tx from the data

  const { deviceId, exchange, provider, binaryPayload, signature, exchangeType, rateType } = input;

  const { fromAccount, fromParentAccount } = exchange;
  const { toAccount, toParentAccount } = exchange;

  return new Observable(o => {
    let unsubscribed = false;
    let ignoreTransportError = false;
    let currentStep: CompleteExchangeStep = "INIT";

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, async transport => {
        const providerConfig = getProviderConfig(provider);
        if (providerConfig.type !== "CEX") {
          throw new Error(`Unsupported provider type ${providerConfig.type}`);
        }

        const exchange = createExchange(transport, exchangeType, rateType, providerConfig.version);
        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const accountBridge = getAccountBridge(refundAccount);
        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        const payoutCurrency = getAccountCurrency(toAccount);
        const refundCurrency = getAccountCurrency(fromAccount);
        const mainRefundCurrency = getAccountCurrency(refundAccount);
        if (mainPayoutCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");
        if (mainRefundCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");

        transaction = await accountBridge.prepareTransaction(refundAccount, transaction);

        if (unsubscribed) return;

        const { errors, estimatedFees } = await accountBridge.getTransactionStatus(
          refundAccount,
          transaction,
        );

        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);
        if (errorsKeys.length > 0) throw errors[errorsKeys[0]]; // throw the first error

        currentStep = "SET_PARTNER_KEY";
        await exchange.setPartnerKey(convertToAppExchangePartnerKey(providerConfig));
        if (unsubscribed) return;

        currentStep = "CHECK_PARTNER";
        await exchange.checkPartner(providerConfig.signature);
        if (unsubscribed) return;

        currentStep = "PROCESS_TRANSACTION";
        await exchange.processTransaction(Buffer.from(binaryPayload, "hex"), estimatedFees);
        if (unsubscribed) return;

        const goodSign = convertSignature(signature, exchangeType);
        currentStep = "CHECK_TRANSACTION_SIGNATURE";

        await exchange.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const payoutAddressParameters = await perFamily[
          mainPayoutCurrency.family
        ].getSerializedAddressParameters(
          payoutAccount.freshAddressPath,
          payoutAccount.derivationMode,
          mainPayoutCurrency.id,
        );
        if (unsubscribed) return;

        const { config: payoutAddressConfig, signature: payoutAddressConfigSignature } =
          getCurrencyExchangeConfig(payoutCurrency);

        try {
          currentStep = "CHECK_PAYOUT_ADDRESS";
          await exchange.checkPayoutAddress(
            payoutAddressConfig,
            payoutAddressConfigSignature,
            payoutAddressParameters.addressParameters,
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount(undefined, {
              accountName: payoutAccount.name,
            });
          }

          throw convertTransportError(currentStep, e);
        }

        o.next({
          type: "complete-exchange-requested",
          estimatedFees: estimatedFees.toString(),
        });

        // Swap specific checks to confirm the refund address is correct.
        if (unsubscribed) return;
        const refundAddressParameters = await perFamily[
          mainRefundCurrency.family
        ].getSerializedAddressParameters(
          refundAccount.freshAddressPath,
          refundAccount.derivationMode,
          mainRefundCurrency.id,
        );
        if (unsubscribed) return;

        const { config: refundAddressConfig, signature: refundAddressConfigSignature } =
          getCurrencyExchangeConfig(refundCurrency);
        if (unsubscribed) return;

        try {
          currentStep = "CHECK_REFUND_ADDRESS";
          await exchange.checkRefundAddress(
            refundAddressConfig,
            refundAddressConfigSignature,
            refundAddressParameters.addressParameters,
          );
          log(COMPLETE_EXCHANGE_LOG, "checkrefund address");
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            log(COMPLETE_EXCHANGE_LOG, "transport error");
            throw new WrongDeviceForAccount(undefined, {
              accountName: refundAccount.name,
            });
          }

          throw convertTransportError(currentStep, e);
        }

        if (unsubscribed) return;
        ignoreTransportError = true;
        currentStep = "SIGN_COIN_TRANSACTION";
        await exchange.signCoinTransaction();
      }).catch(e => {
        if (ignoreTransportError) return;

        if (e instanceof TransportStatusError && e.statusCode === 0x6a84) {
          throw new TransactionRefusedOnDevice();
        }

        throw convertTransportError(currentStep, e);
      });
      await delay(3000);
      if (unsubscribed) return;
      o.next({
        type: "complete-exchange-result",
        completeExchangeResult: transaction,
      });
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

function convertSignature(signature: string, exchangeType: ExchangeTypes): Buffer {
  return exchangeType === ExchangeTypes.SwapNg
    ? Buffer.from(signature, "base64url")
    : <Buffer>secp256k1.signatureExport(Buffer.from(signature, "hex"));
}

export default completeExchange;
