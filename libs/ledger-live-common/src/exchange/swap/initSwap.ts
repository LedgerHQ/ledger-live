import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { from, Observable } from "rxjs";
import secp256k1 from "secp256k1";
import { getCurrencyExchangeConfig } from "../";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "../../account";
import { getAccountBridge } from "../../bridge";
import { getEnv } from "../../env";
import { SwapGenericAPIError, TransactionRefusedOnDevice } from "../../errors";
import perFamily from "../../generated/exchange";
import { withDevice } from "../../hw/deviceAccess";
import network from "../../network";
import { delay } from "../../promise";
import Exchange, { ExchangeTypes, RateTypes } from "@ledgerhq/hw-app-exchange";
import { getProviderConfig, getSwapAPIBaseURL } from "./";
import { mockInitSwap } from "./mock";
import type { InitSwapInput, SwapRequestEvent } from "./types";

const withDevicePromise = (deviceId, fn) =>
  withDevice(deviceId)((transport) => from(fn(transport))).toPromise();

// init a swap with the Exchange app
// throw if TransactionStatus have errors
// you get at the end a final Transaction to be done (it's not yet signed, nor broadcasted!) and a swapId
const initSwap = (input: InitSwapInput): Observable<SwapRequestEvent> => {
  let swapId;
  let { transaction } = input;
  const { exchange, exchangeRate, deviceId, userId } = input;

  if (getEnv("MOCK")) return mockInitSwap(exchange, exchangeRate, transaction);
  return new Observable((o) => {
    let unsubscribed = false;

    const confirmSwap = async () => {
      let ignoreTransportError;
      log("swap", `attempt to connect to ${deviceId}`);
      await withDevicePromise(deviceId, async (transport) => {
        const ratesFlag =
          exchangeRate.tradeMethod === "fixed"
            ? RateTypes.Fixed
            : RateTypes.Floating;
        const swap = new Exchange(transport, ExchangeTypes.Swap, ratesFlag);
        // NB this id is crucial to prevent replay attacks, if it changes
        // we need to start the flow again.
        const deviceTransactionId = await swap.startNewTransaction();
        if (unsubscribed) return;

        const { provider, rateId, payoutNetworkFees } = exchangeRate;
        const { fromParentAccount, fromAccount, toParentAccount, toAccount } =
          exchange;
        const { amount } = transaction;
        const refundCurrency = getAccountCurrency(fromAccount);
        const unitFrom = getAccountUnit(exchange.fromAccount);
        const unitTo = getAccountUnit(exchange.toAccount);
        const payoutCurrency = getAccountCurrency(toAccount);
        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const apiAmount = new BigNumber(amount).div(
          new BigNumber(10).pow(unitFrom.magnitude)
        );
        // Request a swap, this locks the rates for fixed trade method only.
        // NB Added the try/catch because of the API stability issues.
        let res;

        const swapProviderConfig = getProviderConfig(provider);

        const { needsBearerToken } = swapProviderConfig;

        const headers = {
          EquipmentId: getEnv("USER_ID"),
          ...(needsBearerToken ? { Authorization: `Bearer ${userId}` } : {}),
          ...(userId ? { userId } : {}), // NB: only for Wyre AFAIK
        };

        const data = {
          provider,
          amountFrom: apiAmount.toString(),
          from: refundCurrency.id,
          to: payoutCurrency.id,
          address: payoutAccount.freshAddress,
          refundAddress: refundAccount.freshAddress,
          deviceTransactionId,
          ...(rateId && ratesFlag === RateTypes.Fixed
            ? {
                rateId,
              }
            : {}), // NB float rates dont need rate ids.
        };

        try {
          res = await network({
            method: "POST",
            url: `${getSwapAPIBaseURL()}/swap`,
            headers,
            data,
          });

          if (unsubscribed || !res || !res.data) return;
        } catch (e) {
          o.next({
            type: "init-swap-error",
            error: new SwapGenericAPIError(),
            swapId,
          });
          o.complete();
          return;
        }

        const swapResult = res.data;
        swapId = swapResult.swapId;

        const accountBridge = getAccountBridge(refundAccount);
        transaction = accountBridge.updateTransaction(transaction, {
          recipient: swapResult.payinAddress,
        });

        if (refundCurrency.id === "ripple") {
          transaction = accountBridge.updateTransaction(transaction, {
            tag: new BigNumber(swapResult.payinExtraId).toNumber(),
          });
          invariant(
            transaction.tag,
            "Refusing to swap xrp without a destination tag"
          );
        } else if (refundCurrency.id === "stellar") {
          transaction = accountBridge.updateTransaction(transaction, {
            memoValue: swapResult.payinExtraId,
            memoType: "MEMO_TEXT",
          });
          invariant(
            transaction.memoValue,
            "Refusing to swap xlm without a destination memo"
          );
        }

        // Triplecheck we're not working with an abandonseed recipient anymore
        invariant(
          transaction.recipient !==
            getAbandonSeedAddress(
              refundCurrency.type === "TokenCurrency"
                ? refundCurrency.parentCurrency.id
                : refundCurrency.id
            ),
          "Recipient address should never be the abandonseed address"
        );
        transaction = await accountBridge.prepareTransaction(
          refundAccount,
          transaction
        );
        if (unsubscribed) return;
        const { errors, estimatedFees } =
          await accountBridge.getTransactionStatus(refundAccount, transaction);
        if (unsubscribed) return;
        const errorsKeys = Object.keys(errors);

        if (errorsKeys.length > 0) {
          throw errors[errorsKeys[0]]; // throw the first error
        }

        if (swapProviderConfig.type !== "CEX") {
          throw new Error(
            `Unsupported provider type ${swapProviderConfig.type}`
          );
        }

        // Prepare swap app to receive the tx to forward.
        await swap.setPartnerKey(swapProviderConfig.nameAndPubkey);
        if (unsubscribed) return;

        await swap.checkPartner(swapProviderConfig.signature);
        if (unsubscribed) return;

        await swap.processTransaction(
          Buffer.from(swapResult.binaryPayload, "hex"),
          estimatedFees
        );
        if (unsubscribed) return;
        const goodSign = <Buffer>(
          secp256k1.signatureExport(Buffer.from(swapResult.signature, "hex"))
        );
        await swap.checkTransactionSignature(goodSign);
        if (unsubscribed) return;
        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        invariant(
          mainPayoutCurrency.type === "CryptoCurrency",
          "This should be a cryptocurrency"
        );
        // FIXME: invariant not triggering typescriptp type guard
        if (mainPayoutCurrency.type !== "CryptoCurrency") {
          throw new Error("This should be a cryptocurrency");
        }
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
        } = getCurrencyExchangeConfig(payoutCurrency);

        try {
          await swap.checkPayoutAddress(
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

        if (unsubscribed) return;
        const mainRefundCurrency = getAccountCurrency(refundAccount);
        invariant(
          mainRefundCurrency.type === "CryptoCurrency",
          "This should be a cryptocurrency"
        );
        // FIXME: invariant not triggering typescriptp type guard
        if (mainRefundCurrency.type !== "CryptoCurrency") {
          throw new Error("This should be a cryptocurrency");
        }
        const refundAddressParameters = await perFamily[
          mainRefundCurrency.family
        ].getSerializedAddressParameters(
          refundAccount.freshAddressPath,
          refundAccount.derivationMode,
          mainRefundCurrency.id
        );
        if (unsubscribed) return;
        const {
          config: refundAddressConfig,
          signature: refundAddressConfigSignature,
        } = getCurrencyExchangeConfig(refundCurrency);
        if (unsubscribed) return;
        // NB Floating rates may change the original amountTo so we can pass an override
        // to properly render the amount on the device confirmation steps. Although changelly
        // made the calculation inside the binary payload, we still have to deal with it here
        // to not break their other clients.
        let amountExpectedTo;

        if (swapResult?.amountExpectedTo) {
          amountExpectedTo = new BigNumber(swapResult.amountExpectedTo)
            .times(new BigNumber(10).pow(unitTo.magnitude))
            .minus(new BigNumber(payoutNetworkFees || 0))
            .toString();
        }

        o.next({
          type: "init-swap-requested",
          amountExpectedTo,
          estimatedFees,
        });

        try {
          await swap.checkRefundAddress(
            refundAddressConfig,
            refundAddressConfigSignature,
            refundAddressParameters.addressParameters
          );
        } catch (e) {
          // @ts-expect-error TransportStatusError to be typed on ledgerjs
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount(undefined, {
              accountName: refundAccount.name,
            });
          }

          throw e;
        }

        if (unsubscribed) return;
        ignoreTransportError = true;
        await swap.signCoinTransaction();
      }).catch((e) => {
        if (ignoreTransportError) return;

        // @ts-expect-error TransportStatusError to be typed on ledgerjs
        if (e instanceof TransportStatusError && e.statusCode === 0x6a84) {
          throw new TransactionRefusedOnDevice();
        }

        throw e;
      });
      if (!swapId) return;
      log("swap", "awaiting device disconnection");
      await delay(3000);
      if (unsubscribed) return;
      o.next({
        type: "init-swap-result",
        initSwapResult: {
          transaction,
          swapId,
        },
      });
    };

    confirmSwap().then(
      () => {
        o.complete();
        unsubscribed = true;
      },
      (e) => {
        o.next({
          type: "init-swap-error",
          error: e,
          swapId,
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

export default initSwap;
