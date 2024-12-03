import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import {
  TransportStatusError,
  WrongDeviceForAccountPayout,
  WrongDeviceForAccountRefund,
} from "@ledgerhq/errors";
import Exchange, {
  decodePayloadProtobuf,
  ExchangeTypes,
  RateTypes,
} from "@ledgerhq/hw-app-exchange";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { firstValueFrom, from, Observable } from "rxjs";
import secp256k1 from "secp256k1";
import { getCurrencyExchangeConfig } from "../";
import { getAccountCurrency, getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import { getEnv } from "@ledgerhq/live-env";
import {
  SwapGenericAPIError,
  SwapRateExpiredError,
  TransactionRefusedOnDevice,
} from "../../errors";
import { withDevice } from "../../hw/deviceAccess";
import { delay } from "../../promise";
import { getSwapAPIBaseURL, getSwapUserIP } from "./";
import { mockInitSwap } from "./mock";
import type { InitSwapInput, SwapRequestEvent } from "./types";
import { convertToAppExchangePartnerKey, getSwapProvider } from "../providers";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { CEXProviderConfig } from "../providers/swap";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

// init a swap with the Exchange app
// throw if TransactionStatus have errors
// you get at the end a final Transaction to be done (it's not yet signed, nor broadcasted!) and a swapId
const initSwap = (input: InitSwapInput): Observable<SwapRequestEvent> => {
  let swapId;
  let { transaction } = input;
  const { exchange, exchangeRate, deviceId } = input;

  if (getEnv("MOCK")) return mockInitSwap(exchange, exchangeRate, transaction);
  return new Observable(o => {
    let unsubscribed = false;

    const confirmSwap = async () => {
      let ignoreTransportError;
      let magnitudeAwareRate;
      log("swap", `attempt to connect to ${deviceId}`);
      await withDevicePromise(deviceId, async transport => {
        const ratesFlag =
          exchangeRate.tradeMethod === "fixed" ? RateTypes.Fixed : RateTypes.Floating;
        const swap = new Exchange(transport, ExchangeTypes.Swap, ratesFlag);
        // NB this id is crucial to prevent replay attacks, if it changes
        // we need to start the flow again.
        const deviceTransactionId = await swap.startNewTransaction();
        if (unsubscribed) return;

        const { provider, rateId } = exchangeRate;
        const { fromParentAccount, fromAccount, toParentAccount, toAccount } = exchange;
        const { amount } = transaction;
        const refundCurrency = getAccountCurrency(fromAccount);
        const unitFrom = getAccountCurrency(exchange.fromAccount).units[0];
        const payoutCurrency = getAccountCurrency(toAccount);
        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const apiAmount = new BigNumber(amount).div(new BigNumber(10).pow(unitFrom.magnitude));
        // Request a swap, this locks the rates for fixed trade method only.
        // NB Added the try/catch because of the API stability issues.
        let res;

        const swapProviderConfig = await getSwapProvider(provider);

        const headers = {
          EquipmentId: getEnv("USER_ID"),

          ...(getSwapUserIP() !== undefined ? getSwapUserIP() : {}),
        };

        const data = {
          provider,
          amountFrom: apiAmount.toString(),
          amountFromInSmallestDenomination: amount.toNumber(),
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
        } catch (e: any) {
          if (e.msg.messageKey == "WRONG_OR_EXPIRED_RATE_ID") {
            o.next({
              type: "init-swap-error",
              error: new SwapRateExpiredError(),
              swapId,
            });
          }
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
          invariant(transaction.tag, "Refusing to swap xrp without a destination tag");
        } else if (refundCurrency.id === "stellar") {
          transaction = accountBridge.updateTransaction(transaction, {
            memoValue: swapResult.payinExtraId,
            memoType: "MEMO_TEXT",
          });
          invariant(transaction.memoValue, "Refusing to swap xlm without a destination memo");
        }

        // Triplecheck we're not working with an abandonseed recipient anymore
        invariant(
          transaction.recipient !==
            getAbandonSeedAddress(
              refundCurrency.type === "TokenCurrency"
                ? refundCurrency.parentCurrency.id
                : refundCurrency.id,
            ),
          "Recipient address should never be the abandonseed address",
        );
        transaction = await accountBridge.prepareTransaction(refundAccount, transaction);
        if (unsubscribed) return;
        const { errors, estimatedFees } = await accountBridge.getTransactionStatus(
          refundAccount,
          transaction,
        );
        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);

        if (errorsKeys.length > 0) {
          throw errors[errorsKeys[0]]; // throw the first error
        }

        if (swapProviderConfig.useInExchangeApp === false) {
          throw new Error(`Unsupported provider type ${swapProviderConfig.type}`);
        }

        // Prepare swap app to receive the tx to forward.
        await swap.setPartnerKey(
          convertToAppExchangePartnerKey(swapProviderConfig as CEXProviderConfig),
        );
        if (unsubscribed) return;

        await swap.checkPartner((swapProviderConfig as CEXProviderConfig).signature!);
        if (unsubscribed) return;

        await swap.processTransaction(Buffer.from(swapResult.binaryPayload, "hex"), estimatedFees);
        if (unsubscribed) return;
        const goodSign = <Buffer>(
          secp256k1.signatureExport(Buffer.from(swapResult.signature, "hex"))
        );
        await swap.checkTransactionSignature(goodSign);
        if (unsubscribed) return;
        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        invariant(mainPayoutCurrency.type === "CryptoCurrency", "This should be a cryptocurrency");
        // FIXME: invariant not triggering typescriptp type guard
        if (mainPayoutCurrency.type !== "CryptoCurrency") {
          throw new Error("This should be a cryptocurrency");
        }
        const mainPayoutBridge = getAccountBridge(payoutAccount);
        const payoutAddressParameters = mainPayoutBridge.getSerializedAddressParameters(
          payoutAccount,
          mainPayoutCurrency.id,
        );
        if (unsubscribed) return;
        if (!payoutAddressParameters) {
          throw new Error(`Family not supported: ${mainPayoutCurrency.family}`);
        }
        const { config: payoutAddressConfig, signature: payoutAddressConfigSignature } =
          await getCurrencyExchangeConfig(payoutCurrency);

        try {
          await swap.validatePayoutOrAsset(
            payoutAddressConfig,
            payoutAddressConfigSignature,
            payoutAddressParameters,
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccountPayout(undefined, {
              accountName: getDefaultAccountName(payoutAccount),
            });
          }

          throw e;
        }

        if (unsubscribed) return;
        const mainRefundCurrency = getAccountCurrency(refundAccount);
        invariant(mainRefundCurrency.type === "CryptoCurrency", "This should be a cryptocurrency");
        // FIXME: invariant not triggering typescriptp type guard
        if (mainRefundCurrency.type !== "CryptoCurrency") {
          throw new Error("This should be a cryptocurrency");
        }
        const refundAddressParameters = accountBridge.getSerializedAddressParameters(
          refundAccount,
          mainRefundCurrency.id,
        );
        if (unsubscribed) return;
        if (!refundAddressParameters) {
          throw new Error(`Family not supported: ${mainRefundCurrency.family}`);
        }
        const { config: refundAddressConfig, signature: refundAddressConfigSignature } =
          await getCurrencyExchangeConfig(refundCurrency);
        if (unsubscribed) return;
        // NB Floating rates may change the original amountTo so we can pass an override
        // to properly render the amount on the device confirmation steps. Although changelly
        // made the calculation inside the binary payload, we still have to deal with it here
        // to not break their other clients.

        let amountExpectedTo;
        if (swapResult.binaryPayload) {
          const decodePayload = await decodePayloadProtobuf(swapResult.binaryPayload);
          amountExpectedTo = new BigNumber(decodePayload.amountToWallet.toString());
          magnitudeAwareRate = transaction.amount && amountExpectedTo.dividedBy(transaction.amount);
        }

        let amountExpectedFrom;
        if (swapResult.binaryPayload) {
          const decodePayload = await decodePayloadProtobuf(swapResult.binaryPayload);
          amountExpectedFrom = new BigNumber(decodePayload.amountToProvider.toString());
          if (data.amountFromInSmallestDenomination !== amountExpectedFrom.toNumber())
            throw new Error("AmountFrom received from partner's payload mismatch user input");
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
            refundAddressParameters,
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccountRefund(undefined, {
              accountName: getDefaultAccountName(refundAccount),
            });
          }

          throw e;
        }

        if (unsubscribed) return;
        ignoreTransportError = true;
        await swap.signCoinTransaction();
      }).catch(e => {
        if (ignoreTransportError) return;

        if (e instanceof TransportStatusError && e.statusCode === 0x6a84) {
          throw new TransactionRefusedOnDevice("", { step: "SIGN_COIN_TRANSACTION" });
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
          magnitudeAwareRate,
        },
      });
    };

    confirmSwap().then(
      () => {
        o.complete();
        unsubscribed = true;
      },
      e => {
        o.next({
          type: "init-swap-error",
          error: e,
          swapId,
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

export default initSwap;
