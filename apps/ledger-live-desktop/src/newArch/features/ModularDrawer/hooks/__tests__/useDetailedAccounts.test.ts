import * as reactRedux from "react-redux";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { mockDispatch } from "../../../__tests__/shared";
import { useDetailedAccounts } from "../useDetailedAccounts";

jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);

// Mock countervalues logic
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesState: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn((state, { value }) => value), // Return balance as fiat value for testing
}));

// Mock analytics and other dependencies
jest.mock("../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: jest.fn(() => ({
    trackModularDrawerEvent: jest.fn(),
  })),
}));

jest.mock("../useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(() => ({
    openAddAccountFlow: jest.fn(),
  })),
}));

jest.mock("~/renderer/reducers/modularDrawer", () => ({
  modularDrawerSourceSelector: jest.fn(() => "test"),
}));

jest.mock("~/renderer/reducers/wallet", () => ({
  useBatchMaybeAccountName: jest.fn(() => ["Ethereum 2"]),
}));

jest.mock("../../utils/formatDetailedAccount", () => ({
  RawDetailedAccount: {},
}));

jest.mock("../../utils/sortAccountsByFiatValue", () => ({
  sortAccountsByFiatValue: jest.fn(accounts => accounts),
}));

jest.mock("@ledgerhq/live-common/utils/getAccountTuplesForCurrency", () => ({
  getAccountTuplesForCurrency: jest.fn(),
}));

describe("useDetailedAccounts", () => {
  it("should return formatted accounts for a crypto currency", () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
        settings: {
          ...INITIAL_STATE.settings,
          counterValueCurrency: { id: "usd", units: [{ code: "USD", magnitude: 2 }] },
        },
        modularDrawer: { source: "test" },
      },
    });

    expect(result.current.detailedAccounts).toEqual([
      {
        id: ETH_ACCOUNT.id,
        name: "Ethereum 2",
        address: ETH_ACCOUNT.freshAddress,
        balance: ETH_ACCOUNT.balance,
        balanceUnit: ETH_ACCOUNT.currency.units[0],
        cryptoId: "ethereum",
        fiatValue: ETH_ACCOUNT.balance.toNumber(), // Mocked calculate function returns balance as fiat value
        ticker: "ETH",
      },
    ]);
  });

  it('should return onAddAccountClick function that dispatches "ADD_ACCOUNT" action', () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
        settings: {
          ...INITIAL_STATE.settings,
          counterValueCurrency: { id: "usd", units: [{ code: "USD", magnitude: 2 }] },
        },
        modularDrawer: { source: "test" },
      },
    });

    const onAddAccountClick = result.current.onAddAccountClick;
    expect(onAddAccountClick).toBeDefined();
    onAddAccountClick();
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: {
        data: {
          currency: asset,
        },
        name: "MODAL_ADD_ACCOUNTS",
      },
      type: "MODAL_OPEN",
    });
  });

  it("should return accounts for a token currency", () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
        settings: {
          ...INITIAL_STATE.settings,
          counterValueCurrency: { id: "usd", units: [{ code: "USD", magnitude: 2 }] },
        },
        modularDrawer: { source: "test" },
      },
    });

    expect(result.current.accounts).toEqual([
      {
        account: ETH_ACCOUNT,
        subAccount: null,
      },
    ]);
  });
});
