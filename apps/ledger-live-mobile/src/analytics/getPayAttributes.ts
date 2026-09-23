import { cardManagementApi, hasCardTransactions } from "@domain/api-card-management";
import { toPayGlobalProperties, type PayGlobalProperties } from "@features/platform-pay-analytics";

type PayCardAuthSlice = Readonly<{
  hasCard: boolean;
  status: string;
}>;

type PayAttributesState = Readonly<{
  payCardAuth: PayCardAuthSlice;
}>;

function queryData<State, Data>(
  select: (state: State) => { data?: Data },
  state: unknown,
): Data | undefined {
  if (typeof state !== "object" || state === null || !("cardApi" in state)) {
    return undefined;
  }
  return select(state as State).data;
}

export function getPayAttributes(
  state: PayAttributesState,
  featureFlagPay: boolean,
  accountTickers: readonly string[],
): PayGlobalProperties {
  const transactionPages = queryData(
    cardManagementApi.endpoints.getCardTransactions.select(undefined),
    state,
  )?.pages;

  return toPayGlobalProperties({
    featureFlagPay,
    hasCard: state.payCardAuth.hasCard,
    isSignedIn: state.payCardAuth.status === "signedIn",
    accountTickers,
    internalWalletBalances: queryData(
      cardManagementApi.endpoints.getInternalWallets.select(),
      state,
    )?.map(wallet => wallet.balance),
    cardStatus: queryData(cardManagementApi.endpoints.getCardStatus.select(), state),
    hasCardTransactions:
      transactionPages === undefined ? undefined : hasCardTransactions(transactionPages),
    cardWallets: queryData(cardManagementApi.endpoints.getCardLinkedWallets.select(), state),
    cashback: queryData(cardManagementApi.endpoints.getCardCashback.select(), state),
  });
}
