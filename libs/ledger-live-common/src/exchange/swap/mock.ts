import { Observable, of } from "rxjs";
import type {
  Exchange,
  ExchangeRate,
  GetMultipleStatus,
  PostSwapAccepted,
  PostSwapCancelled,
  SwapRequestEvent,
} from "./types";
import type { Transaction } from "../../generated/types";

export const mockInitSwap = (
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction,
): Observable<SwapRequestEvent> => {
  return of({
    type: "init-swap-result",
    initSwapResult: {
      transaction,
      swapId: "mockedSwapId",
    },
  });
};

export const mockGetStatus: GetMultipleStatus = async statusList => {
  //Fake delay to show loading UI
  await new Promise(r => setTimeout(r, 800));
  return statusList.map(s => ({ ...s, status: "finished" }));
};

export const mockPostSwapAccepted: PostSwapAccepted = async ({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  provider,
  swapId,
  transactionId,
  /* eslint-enable */
}) => {
  //Fake delay to simulate network
  await new Promise(r => setTimeout(r, 800));

  return null;
};

export const mockPostSwapCancelled: PostSwapCancelled = async ({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  provider,
  swapId,
  /* eslint-enable */
}) => {
  //Fake delay to simulate network
  await new Promise(r => setTimeout(r, 800));

  return null;
};
