import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { makeStacksAccount } from "~/families/stacks/__mocks__/account.mock";
import { renderHook, withFlagOverrides, withReadOnlyDisabled } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import useAccountActions from "~/screens/Account/hooks/useAccountActions";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ key: "Account", name: "Account" }),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// The other actions' sources, out of this test's scope.
jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({
    getCanStakeUsingLedgerLive: () => false,
    getCanStakeUsingPlatformApp: () => false,
    getRouteParamsForPlatformApp: () => null,
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

const account = makeStacksAccount({}, []);
const entry = LegacyAccountEntrySchema.parse(
  mockAccountEntry({
    descriptor: mockAddressAccountDescriptor({ network: "stacks", path: "m/44h/5757h/0h/0/0" }),
    legacyId: AccountIdSchema.parse(account.id),
  }),
);

function renderReceiveAction(isNewReceiveFlowOn: boolean) {
  const { result } = renderHook(() => useAccountActions({ account }), {
    overrideInitialState: withFlagOverrides(
      { newReceiveFlow: { enabled: isNewReceiveFlowOn, params: { excludedFamilies: [] } } },
      (state: State): State => ({
        ...withReadOnlyDisabled(state),
        accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
        accounts: { ...state.accounts, active: [account] },
      }),
    ),
  });
  return [...result.current.mainActions, ...result.current.secondaryActions].find(
    action => action.id === "receive",
  );
}

describe("useAccountActions receive action", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("should open the new receive screen when pressed with the new receive flow on", () => {
    const receive = renderReceiveAction(true);

    expect(receive?.navigationParams).toBeUndefined();
    receive?.customHandler?.();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Receive, {
      screen: ScreenName.ReceiveAddress,
      params: { accountUUID: entry.accountUUID, assetId: "stacks" },
    });
  });

  it("should open the legacy receive screen when pressed with the new receive flow off", () => {
    renderReceiveAction(false)?.customHandler?.();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { accountId: account.id, currency: account.currency },
    });
  });
});
