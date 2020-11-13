// @flow

import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { log } from "@ledgerhq/logs";
import { from } from "rxjs";
import secp256k1 from "secp256k1";
import invariant from "invariant";
import { TransportStatusError, WrongDeviceForAccount } from "@ledgerhq/errors";
import { delay } from "../../promise";
import Exchange from "../hw-app-exchange/Exchange";
import { mockInitSwap } from "./mock";
import perFamily from "../../generated/exchange";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountUnit,
} from "../../account";
import network from "../../network";
import { getAccountBridge } from "../../bridge";
import { BigNumber } from "bignumber.js";
import { SwapGenericAPIError, TransactionRefusedOnDevice } from "../../errors";
import type { SwapRequestEvent, InitSwapInput } from "./types";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { getProviderNameAndSignature, getSwapAPIBaseURL } from "./";
import { getCurrencyExchangeConfig } from "../";
import { getEnv } from "../../env";

const withDevicePromise = (deviceId, fn) =>
  withDevice(deviceId)((transport) => from(fn(transport))).toPromise();

// init a swap with the Exchange app
// throw if TransactionStatus have errors
// you get at the end a final Transaction to be done (it's not yet signed, nor broadcasted!) and a swapId
const initSwap = (input: InitSwapInput): Observable<SwapRequestEvent> => {
  let { exchange, exchangeRate, transaction, deviceId } = input;
  if (getEnv("MOCK")) return mockInitSwap(exchange, exchangeRate, transaction);
  return Observable.create((o) => {
    let unsubscribed = false;
    const confirmSwap = async () => {
      let swapId;
      let ignoreTransportError;

      log("swap", `attempt to connect to ${deviceId}`);
      await withDevicePromise(deviceId, async (transport) => {
        const swap = new Exchange(transport, 0x00);

        // NB this id is crucial to prevent replay attacks, if it changes
        // we need to start the flow again.
        const deviceTransactionId = await swap.startNewTransaction();
        if (unsubscribed) return;

        const { provider, rateId } = exchangeRate;
        const {
          fromParentAccount,
          fromAccount,
          toParentAccount,
          toAccount,
        } = exchange;
        const { amount } = transaction;
        const refundCurrency = getAccountCurrency(fromAccount);
        const unitFrom = getAccountUnit(exchange.fromAccount);
        const payoutCurrency = getAccountCurrency(toAccount);
        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const apiAmount = BigNumber(amount).div(
          BigNumber(10).pow(unitFrom.magnitude)
        );

        // Request a lock on the specified rate for 20 minutes,
        // user is expected to send funds after this.
        // NB Added the try/catch because of the API stability issues.
        let res;
        try {
          res = await network({
            method: "POST",
            url: `${getSwapAPIBaseURL()}/swap`,
            data: [
              {
                provider,
                amountFrom: apiAmount,
                from: refundCurrency.id,
                to: payoutCurrency.id,
                rateId,
                address: payoutAccount.freshAddress,
                refundAddress: refundAccount.freshAddress,
                deviceTransactionId,
              },
            ],
          });
          if (unsubscribed || !res || !res.data) return;
        } catch (e) {
          o.next({
            type: "init-swap-error",
            error: new SwapGenericAPIError(),
          });
          o.complete();
          return;
        }

        const swapResult = res.data[0];
        swapId = swapResult.swapId;
        const providerNameAndSignature = getProviderNameAndSignature(
          swapResult.provider
        );

        const accountBridge = getAccountBridge(refundAccount);
        transaction = accountBridge.updateTransaction(transaction, {
          recipient: swapResult.payinAddress,
        });

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

        const {
          errors,
          estimatedFees,
        } = await accountBridge.getTransactionStatus(
          refundAccount,
          transaction
        );
        if (unsubscribed) return;

        if (errors.recipient || errors.amount) {
          throw errors.recipient || errors.amount;
        }

        // Prepare swap app to receive the tx to forward.
        await swap.setPartnerKey(providerNameAndSignature.nameAndPubkey);
        if (unsubscribed) return;

        await swap.checkPartner(providerNameAndSignature.signature);
        if (unsubscribed) return;

        await swap.processTransaction(
          Buffer.from(swapResult.binaryPayload, "hex"),
          estimatedFees
        );
        if (unsubscribed) return;

        const goodSign = secp256k1.signatureExport(
          Buffer.from(swapResult.signature, "hex")
        );
        await swap.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        invariant(
          mainPayoutCurrency.type === "CryptoCurrency",
          "This should be a cryptocurrency"
        );
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
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount(null, {
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
        o.next({ type: "init-swap-requested" });

        try {
          await swap.checkRefundAddress(
            refundAddressConfig,
            refundAddressConfigSignature,
            refundAddressParameters.addressParameters
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccount(null, {
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
        initSwapResult: { transaction, swapId },
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
        });
        o.complete();
        unsubscribed = true;
      }
    );
    return () => {
      unsubscribed = true;
    };
  });
  // );
};

export default initSwap;
