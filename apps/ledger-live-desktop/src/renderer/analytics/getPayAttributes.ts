import { cardManagementApi, hasCardTransactions } from "@domain/api-card-management";
import type { PayCardAuthState } from "@features/flow-pay-card-auth/state";
import { toPayGlobalProperties, type PayGlobalProperties } from "@features/platform-pay-analytics";

type PayAttributesState = Readonly<{
  payCardAuth: PayCardAuthState;
}>;

function queryData<State, Data>(
  select: (state: State) => { data?: Data },
  state: unknown,
): Data | undefined {
  if (typeof state !== "object" || state === null || !(cardManagementApi.reducerPath in state)) {
    return undefined;
  }
  return select(state as State).data;
}

export function getPayAttributes(
  state: PayAttributesState,
  featureFlagPay: boolean,
  accountTickers: readonly string[],
): PayGlobalProperties {
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
    hasCardTransactions: hasCardTransactions(
      queryData(cardManagementApi.endpoints.getCardTransactions.select(undefined), state)?.pages,
    ),
    cardWallets: queryData(cardManagementApi.endpoints.getCardLinkedWallets.select(), state),
    cashback: queryData(cardManagementApi.endpoints.getCardCashback.select(), state),
  });
}
