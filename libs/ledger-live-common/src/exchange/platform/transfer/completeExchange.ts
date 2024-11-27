import secp256k1 from "secp256k1";
import { firstValueFrom, from, Observable } from "rxjs";
import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";

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
} from "../types";
import { CompleteExchangeStep, convertTransportError } from "../../error";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

const completeExchange = (
  input: CompleteExchangeInputFund | CompleteExchangeInputSell,
): Observable<CompleteExchangeRequestEvent> => {
  let { transaction } = input; // TODO build a tx from the data

  const {
    deviceId,
    exchange,
    provider,
    binaryPayload,
    signature,
    exchangeType,
    rateType, // TODO Pass fixed/float for UI switch ?
  } = input;

  const { fromAccount, fromParentAccount } = exchange;

  return new Observable(o => {
    let unsubscribed = false;
    let ignoreTransportError = false;
    let currentStep: CompleteExchangeStep = "INIT";

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, async transport => {
        const providerNameAndSignature = await getProviderConfig(exchangeType, provider);

        if (!providerNameAndSignature) throw new Error("Could not get provider infos");

        const exchange = createExchange(
          transport,
          exchangeType,
          rateType,
          providerNameAndSignature.version,
        );

        const mainAccount = getMainAccount(fromAccount, fromParentAccount);
        const accountBridge = getAccountBridge(mainAccount);
        const mainPayoutCurrency = getAccountCurrency(mainAccount);
        const payoutCurrency = getAccountCurrency(fromAccount);

        if (mainPayoutCurrency.type !== "CryptoCurrency")
          throw new Error(`This should be a cryptocurrency, got ${mainPayoutCurrency.type}`);

        transaction = await accountBridge.prepareTransaction(mainAccount, transaction);
        if (unsubscribed) return;

        const { errors, estimatedFees } = await accountBridge.getTransactionStatus(
          mainAccount,
          transaction,
        );
        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);
        if (errorsKeys.length > 0) throw errors[errorsKeys[0]]; // throw the first error

        currentStep = "SET_PARTNER_KEY";
        await exchange.setPartnerKey(convertToAppExchangePartnerKey(providerNameAndSignature));
        if (unsubscribed) return;

        currentStep = "CHECK_PARTNER";
        await exchange.checkPartner(providerNameAndSignature.signature!);
        if (unsubscribed) return;

        currentStep = "PROCESS_TRANSACTION";
        const { payload, format }: { payload: Buffer; format: PayloadSignatureComputedFormat } =
          isExchangeTypeNg(exchange.transactionType)
            ? { payload: Buffer.from("." + binaryPayload), format: "jws" }
            : { payload: Buffer.from(binaryPayload, "hex"), format: "raw" };
        await exchange.processTransaction(payload, estimatedFees, format);
        if (unsubscribed) return;

        const goodSign = convertSignature(signature, exchange.transactionType);

        currentStep = "CHECK_TRANSACTION_SIGNATURE";
        await exchange.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const payoutAddressParameters = accountBridge.getSerializedAddressParameters(mainAccount);
        if (unsubscribed) return;
        if (!payoutAddressParameters) {
          throw new Error(`Family not supported: ${mainPayoutCurrency.family}`);
        }

        const { config: payoutAddressConfig, signature: payoutAddressConfigSignature } =
          await getCurrencyExchangeConfig(payoutCurrency);

        try {
          o.next({
            type: "complete-exchange-requested",
            estimatedFees: estimatedFees.toString(),
          });
          currentStep = "CHECK_PAYOUT_ADDRESS";
          await exchange.validatePayoutOrAsset(
            payoutAddressConfig,
            payoutAddressConfigSignature,
            payoutAddressParameters,
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount();
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
      o.next({
        type: "complete-exchange-result",
        completeExchangeResult: transaction,
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
  if (exchangeType === ExchangeTypes.Sell) return Buffer.from(signature, "hex");
  return <Buffer>secp256k1.signatureExport(Buffer.from(signature, "hex"));
}

export default completeExchange;
