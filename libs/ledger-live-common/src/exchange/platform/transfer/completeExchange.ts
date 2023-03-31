import secp256k1 from "secp256k1";
import { from, Observable } from "rxjs";
import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";

import { delay } from "../../../promise";
import ExchangeTransport, { ExchangeTypes } from "@ledgerhq/hw-app-exchange";
import perFamily from "../../../generated/exchange";
import { getAccountCurrency, getMainAccount } from "../../../account";
import { getAccountBridge } from "../../../bridge";
import { TransactionRefusedOnDevice } from "../../../errors";
import { withDevice } from "../../../hw/deviceAccess";
import { getCurrencyExchangeConfig } from "../..";
import { getProvider } from ".";

import type {
  CompleteExchangeInputFund,
  CompleteExchangeInputSell,
  CompleteExchangeRequestEvent,
} from "../types";

const withDevicePromise = (deviceId, fn) =>
  withDevice(deviceId)((transport) => from(fn(transport))).toPromise();

const completeExchange = (
  input: CompleteExchangeInputFund | CompleteExchangeInputSell
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

  return new Observable((o) => {
    let unsubscribed = false;
    let ignoreTransportError = false;

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, async (transport) => {
        const providerNameAndSignature = getProvider(exchangeType, provider);

        if (!providerNameAndSignature)
          throw new Error("Could not get provider infos");

        const exchange = new ExchangeTransport(
          transport,
          exchangeType,
          rateType
        );

        const mainAccount = getMainAccount(fromAccount, fromParentAccount);
        const accountBridge = getAccountBridge(mainAccount);
        const mainPayoutCurrency = getAccountCurrency(mainAccount);
        const payoutCurrency = getAccountCurrency(fromAccount);

        if (mainPayoutCurrency.type !== "CryptoCurrency")
          throw new Error(
            `This should be a cryptocurrency, got ${mainPayoutCurrency.type}`
          );

        transaction = await accountBridge.prepareTransaction(
          mainAccount,
          transaction
        );
        if (unsubscribed) return;

        const { errors, estimatedFees } =
          await accountBridge.getTransactionStatus(mainAccount, transaction);
        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);
        if (errorsKeys.length > 0) throw errors[errorsKeys[0]]; // throw the first error

        await exchange.setPartnerKey(providerNameAndSignature.nameAndPubkey);
        if (unsubscribed) return;

        await exchange.checkPartner(providerNameAndSignature.signature);
        if (unsubscribed) return;

        await exchange.processTransaction(
          Buffer.from(binaryPayload, "hex"),
          estimatedFees
        );
        if (unsubscribed) return;

        const bufferSignature = Buffer.from(signature, "hex");
        /**
         * For the Fund and Swap flow, the signature sent to the nano needs to
         * be in DER format, which is not the case for Sell flow. Hence the
         * ternary.
         * cf. https://github.com/LedgerHQ/app-exchange/blob/e67848f136dc7227521791b91f608f7cd32e7da7/src/check_tx_signature.c#L14-L32
         */
        const goodSign =
          exchangeType === ExchangeTypes.Sell
            ? bufferSignature
            : Buffer.from(secp256k1.signatureExport(bufferSignature));

        if (!goodSign) {
          throw new Error("Could not check provider signature");
        }

        await exchange.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const payoutAddressParameters = await perFamily[
          mainPayoutCurrency.family
        ].getSerializedAddressParameters(
          mainAccount.freshAddressPath,
          mainAccount.derivationMode
        );
        if (unsubscribed) return;

        const {
          config: payoutAddressConfig,
          signature: payoutAddressConfigSignature,
        } = getCurrencyExchangeConfig(payoutCurrency);

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
              accountName: mainAccount.name,
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
