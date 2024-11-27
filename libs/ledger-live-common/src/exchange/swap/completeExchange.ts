import {
  TransportStatusError,
  WrongDeviceForAccountPayout,
  WrongDeviceForAccountRefund,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { firstValueFrom, from, Observable } from "rxjs";
import secp256k1 from "secp256k1";
import { getCurrencyExchangeConfig } from "../";
import { getAccountCurrency, getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import { TransactionRefusedOnDevice } from "../../errors";
import { withDevice } from "../../hw/deviceAccess";
import { delay } from "../../promise";
import {
  createExchange,
  ExchangeTypes,
  getExchangeErrorMessage,
  PayloadSignatureComputedFormat,
} from "@ledgerhq/hw-app-exchange";
import type { CompleteExchangeInputSwap, CompleteExchangeRequestEvent } from "../platform/types";
import { convertToAppExchangePartnerKey, getSwapProvider } from "../providers";
import { CompleteExchangeStep, convertTransportError } from "../error";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import BigNumber from "bignumber.js";
import { CEXProviderConfig } from "../providers/swap";

const withDevicePromise = (deviceId, fn) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

const COMPLETE_EXCHANGE_LOG = "SWAP-CompleteExchange";

const completeExchange = (
  input: CompleteExchangeInputSwap,
): Observable<CompleteExchangeRequestEvent> => {
  let { transaction } = input; // TODO build a tx from the data

  const { deviceId, exchange, provider, binaryPayload, signature, rateType, exchangeType } = input;

  const { fromAccount, fromParentAccount } = exchange;
  const { toAccount, toParentAccount } = exchange;

  return new Observable(o => {
    let unsubscribed = false;
    let ignoreTransportError = false;
    let currentStep: CompleteExchangeStep = "INIT";

    const confirmExchange = async () => {
      await withDevicePromise(deviceId, async transport => {
        const providerConfig = await getSwapProvider(provider);
        if (providerConfig.useInExchangeApp === false) {
          throw new Error(`Unsupported provider type ${providerConfig.type}`);
        }

        const exchange = createExchange(transport, exchangeType, rateType, providerConfig.version);

        const refundAccount = getMainAccount(fromAccount, fromParentAccount);
        const payoutAccount = getMainAccount(toAccount, toParentAccount);
        const accountBridge = getAccountBridge(refundAccount);
        const payoutAccountBridge = getAccountBridge(payoutAccount);
        const mainPayoutCurrency = getAccountCurrency(payoutAccount);
        const payoutCurrency = getAccountCurrency(toAccount);
        const refundCurrency = getAccountCurrency(fromAccount);
        const mainRefundCurrency = getAccountCurrency(refundAccount);
        if (mainPayoutCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");
        if (mainRefundCurrency.type !== "CryptoCurrency")
          throw new Error("This should be a cryptocurrency");

        // Thorswap ERC20 token exception hack:
        // - We remove subAccountId to prevent EVM calldata swap during prepareTransaction.
        // - Set amount to 0 to ensure correct handling of the transaction
        //   (this is adjusted during prepareTransaction before signing the actual EVM transaction for tokens but we skip it).
        // - Since it's an ERC20 token transaction (not ETH), amount is set to 0 ETH
        //   because no ETH is being sent, only tokens.
        // - This workaround can't be applied earlier in the flow as the amount is used for display purposes and checks.
        //   We must set the amount to 0 at this stage to avoid issues during the transaction.
        // - This ensures proper handling of Thorswap-ERC20-specific transactions.
        if (
          provider.toLocaleLowerCase() === "thorswap" &&
          transaction.subAccountId &&
          transaction.family === "evm"
        ) {
          const transactionFixed = {
            ...transaction,
            subAccountId: undefined,
            amount: BigNumber(0),
          };
          transaction = await accountBridge.prepareTransaction(refundAccount, transactionFixed);
        } else {
          transaction = await accountBridge.prepareTransaction(refundAccount, transaction);
        }
        if (unsubscribed) return;

        const { errors, estimatedFees } = await accountBridge.getTransactionStatus(
          refundAccount,
          transaction,
        );
        if (unsubscribed) return;

        const errorsKeys = Object.keys(errors);

        if (errorsKeys.length > 0) throw errors[errorsKeys[0]]; // throw the first error

        currentStep = "SET_PARTNER_KEY";
        await exchange.setPartnerKey(
          convertToAppExchangePartnerKey(providerConfig as CEXProviderConfig),
        );
        if (unsubscribed) return;

        currentStep = "CHECK_PARTNER";
        await exchange.checkPartner((providerConfig as CEXProviderConfig).signature);
        if (unsubscribed) return;

        currentStep = "PROCESS_TRANSACTION";

        const { payload, format }: { payload: Buffer; format: PayloadSignatureComputedFormat } =
          exchange.transactionType === ExchangeTypes.SwapNg
            ? { payload: Buffer.from("." + binaryPayload), format: "jws" }
            : { payload: Buffer.from(binaryPayload, "hex"), format: "raw" };
        await exchange.processTransaction(payload, estimatedFees, format);
        if (unsubscribed) return;

        const goodSign = convertSignature(signature, exchange.transactionType);

        currentStep = "CHECK_TRANSACTION_SIGNATURE";
        await exchange.checkTransactionSignature(goodSign);
        if (unsubscribed) return;

        const payoutAddressParameters = payoutAccountBridge.getSerializedAddressParameters(
          payoutAccount,
          mainPayoutCurrency.id,
        );
        if (unsubscribed) return;
        if (!payoutAddressParameters) {
          throw new Error(`Family not supported: ${mainPayoutCurrency.family}`);
        }

        //-- Special case of SPLToken
        //- NOT READY YET
        // //TODO: generalize this case when another blockchain has the same requirement
        // if (isSPLTokenAccount(fromAccount) || isSPLTokenAccount(toAccount)) {
        //   sendPKI(transport);
        // }

        // if (isSPLTokenAccount(fromAccount)) {
        //   //TODO Call AppExchange with TrustedService info
        // }
        // if (isSPLTokenAccount(toAccount)) {
        //   //TODO Call AppExchange with TrustedService info
        // }

        //-- CHECK_PAYOUT_ADDRESS
        const { config: payoutAddressConfig, signature: payoutAddressConfigSignature } =
          await getCurrencyExchangeConfig(payoutCurrency);

        try {
          currentStep = "CHECK_PAYOUT_ADDRESS";
          await exchange.validatePayoutOrAsset(
            payoutAddressConfig,
            payoutAddressConfigSignature,
            payoutAddressParameters,
          );
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            throw new WrongDeviceForAccountPayout(
              getExchangeErrorMessage(e.statusCode, currentStep),
              {
                accountName: getDefaultAccountName(payoutAccount),
              },
            );
          }

          throw convertTransportError(currentStep, e);
        }

        o.next({
          type: "complete-exchange-requested",
          estimatedFees: estimatedFees.toString(),
        });

        // Swap specific checks to confirm the refund address is correct.
        if (unsubscribed) return;
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

        try {
          currentStep = "CHECK_REFUND_ADDRESS";
          await exchange.checkRefundAddress(
            refundAddressConfig,
            refundAddressConfigSignature,
            refundAddressParameters,
          );
          log(COMPLETE_EXCHANGE_LOG, "checkrefund address");
        } catch (e) {
          if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
            log(COMPLETE_EXCHANGE_LOG, "transport error");
            throw new WrongDeviceForAccountRefund(
              getExchangeErrorMessage(e.statusCode, currentStep),
              {
                accountName: getDefaultAccountName(refundAccount),
              },
            );
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

// function isSPLTokenAccount(account: AccountLike): boolean {
//   return account.type !== "TokenAccount" && account.currency.id === "solana";
// }

// async function sendPKI(transport: Transport) {
//   // FIXME: version number hardcoded
//   const { descriptor, signature } = await calService.getCertificate(
//     transport.deviceModel!.id,
//     "1.3.0",
//   );

//   await loadPKI(transport, "TRUSTED_NAME", descriptor, signature);
// }

function convertSignature(signature: string, exchangeType: ExchangeTypes): Buffer {
  return exchangeType === ExchangeTypes.SwapNg
    ? Buffer.from(signature, "base64url")
    : <Buffer>secp256k1.signatureExport(Buffer.from(signature, "hex"));
}

export default completeExchange;
