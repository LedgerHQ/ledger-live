import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import {
  startExchangeLogic,
  completeExchangeLogic,
  CompleteExchangeRequest,
} from "../logic/exchange";
import { ExchangeType } from "./types";
import type { HandlerDeps } from "./types";
import { promisifyUiHandler } from "./promisifyUiHandler";

export function createExchangeStartHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["exchange.start"] {
  return ({ exchangeType }) => {
    const { uiExchangeStart, manifest, accounts, tracking } = getDeps();
    if (!uiExchangeStart) {
      throw new Error("exchange.start UI handler not configured");
    }

    return startExchangeLogic({ manifest, accounts, tracking }, exchangeType, exchangeType =>
      promisifyUiHandler<string>({
        invokeUi: ({ onSuccess, onError }) =>
          uiExchangeStart({ exchangeType, onSuccess, onCancel: onError }),
        onSuccess: () => tracking.startExchangeSuccess(manifest),
        onFail: () => tracking.completeExchangeFail(manifest),
      }),
    );
  };
}

export function createExchangeCompleteHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["exchange.complete"] {
  return params => {
    const { uiExchangeComplete, manifest, accounts, tracking } = getDeps();
    if (!uiExchangeComplete) {
      throw new Error("exchange.complete UI handler not configured");
    }

    const request: CompleteExchangeRequest = {
      provider: params.provider,
      fromAccountId: params.fromAccountId,
      toAccountId: params.exchangeType === "SWAP" ? params.toAccountId : undefined,
      transaction: params.transaction,
      binaryPayload: params.binaryPayload.toString("hex"),
      signature: params.signature.toString("hex"),
      feesStrategy: params.feeStrategy,
      exchangeType: ExchangeType[params.exchangeType as keyof typeof ExchangeType],
      swapId: params.exchangeType === "SWAP" ? params.swapId : undefined,
      rate: params.exchangeType === "SWAP" ? params.rate : undefined,
      tokenCurrency: params.exchangeType === "SELL" ? undefined : params.tokenCurrency,
    };

    return completeExchangeLogic({ manifest, accounts, tracking }, request, request =>
      promisifyUiHandler<string>({
        invokeUi: ({ onSuccess, onError }) =>
          uiExchangeComplete({
            exchangeParams: request,
            onSuccess,
            onCancel: onError,
          }),
        onSuccess: () => tracking.completeExchangeSuccess(manifest),
        onFail: () => tracking.completeExchangeFail(manifest),
      }),
    );
  };
}
