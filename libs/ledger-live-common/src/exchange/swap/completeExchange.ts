import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { from, Observable } from "rxjs";
import secp256k1 from "secp256k1";
import { getCurrencyExchangeConfig } from "../";
import { getAccountCurrency, getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import { TransactionRefusedOnDevice } from "../../errors";
import perFamily from "../../generated/exchange";
import { withDevice } from "../../hw/deviceAccess";
import { delay } from "../../promise";
import ExchangeTransport from "@ledgerhq/hw-app-exchange";
import type {
  CompleteExchangeInputSwap,
  CompleteExchangeRequestEvent,
} from "../platform/types";
import { getProviderConfig } from "./";

const withDevicePromise = (deviceId, fn) =>
  withDevice(deviceId)((transport) => from(fn(transport))).toPromise();

const completeExchange = (
  input: CompleteExchangeInputSwap
): Observable<CompleteExchangeRequestEvent> => {
  let { transaction } = input; // TODO build a tx from the data

  const {
    deviceId,
    exchange,
    provider,
    binaryPayload,
    signature,
    exchangeType,
    rateType,
  } = input;

  const { fromAccount, fromParentAccount } = exchange;
  const { toAccount, toParentAccount } = exchange;

  return new Observable((o) => {
    let unsubscribed = false;
    let ignoreTransportError = false;

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, async (transport) => {
        const providerConfig = getProviderConfig(provider);
        const exchange = new ExchangeTransport(
          transport,
          exchangeType,
          rateType
        );
        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const accountBridge = getAccountBridge(refundAccount);
        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        const refundCurrency = getAccountCurrency(refundAccount);
        if (mainPayoutCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");
        if (refundCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");

        transaction = await accountBridge.prepareTransaction(
          refundAccount,
          transaction
        );

        if (unsubscribed) return;

        const { errors, estimatedFees } =
          await accountBridge.getTransactionStatus(refundAccount, transaction);
        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);
        if (errorsKeys.length > 0) throw errors[errorsKeys[0]]; // throw the first error

        if (providerConfig.type !== "CEX") {
          throw new Error(`Unsupported provider type ${providerConfig.type}`);
        }

        await exchange.setPartnerKey(providerConfig.nameAndPubkey);
        if (unsubscribed) return;

        await exchange.checkPartner(providerConfig.signature);
        if (unsubscribed) return;

        await exchange.processTransaction(
          Buffer.from(binaryPayload, "hex"),
          estimatedFees
        );
        if (unsubscribed) return;

        const goodSign = <Buffer>(
          secp256k1.signatureExport(Buffer.from(signature, "hex"))
        );
        await exchange.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const payoutAddressParameters = await perFamily[
          mainPayoutCurrency.family
        ].getSerializedAddressParameters(
          payoutAccount.freshAddressPath,
          payoutAccount.derivationMode,
          mainPayoutCurrency.id
        );
        if (unsubscribed) return;

        const {
          config: payoutAddressConfig,
          signature: payoutAddressConfigSignature,
        } = getCurrencyExchangeConfig(mainPayoutCurrency);

        try {
          await exchange.checkPayoutAddress(
            payoutAddressConfig,
            payoutAddressConfigSignature,
            payoutAddressParameters.addressParameters
          );
        } catch (e) {
          // @ts-expect-error TransportStatusError to be typed on ledgerjs
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount(undefined, {
              accountName: payoutAccount.name,
            });
          }

          throw e;
        }

        // Swap specific checks to confirm the refund address is correct.
        if (unsubscribed) return;
        const refundAddressParameters = await perFamily[
          refundCurrency.family
        ].getSerializedAddressParameters(
          refundAccount.freshAddressPath,
          refundAccount.derivationMode,
          refundCurrency.id
        );
        if (unsubscribed) return;

        const {
          config: refundAddressConfig,
          signature: refundAddressConfigSignature,
        } = getCurrencyExchangeConfig(refundCurrency);
        if (unsubscribed) return;

        try {
          await exchange.checkRefundAddress(
            refundAddressConfig,
            refundAddressConfigSignature,
            refundAddressParameters.addressParameters
          );
          log("exchange", "checkrefund address");
        } catch (e) {
          // @ts-expect-error TransportStatusError to be typed on ledgerjs
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            log("exchange", "transport error");
            throw new WrongDeviceForAccount(undefined, {
              accountName: refundAccount.name,
            });
          }
          throw e;
        }

        o.next({
          type: "complete-exchange-requested",
          estimatedFees,
        });

        if (unsubscribed) return;
        ignoreTransportError = true;
        await exchange.signCoinTransaction();
      }).catch((e) => {
        if (ignoreTransportError) return;

        // @ts-expect-error TransportStatusError to be typed on ledgerjs
        if (e instanceof TransportStatusError && e.statusCode === 0x6a84) {
          throw new TransactionRefusedOnDevice();
        }

        throw e;
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
      (e) => {
        o.next({
          type: "complete-exchange-error",
          error: e,
        });
        o.complete();
        unsubscribed = true;
      }
    );
    return () => {
      unsubscribed = true;
    };
  });
};

export default completeExchange;
