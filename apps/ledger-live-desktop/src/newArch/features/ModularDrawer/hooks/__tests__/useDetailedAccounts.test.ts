import { renderHook } from "tests/testSetup";
import { useDetailedAccounts } from "../useDetailedAccounts";
import { Mocked_ETH_Account } from "../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import * as reactRedux from "react-redux";
import { mockDispatch } from "../../__tests__/shared";

jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);

describe("useDetailedAccounts", () => {
  it("should return formatted accounts for a crypto currency", () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: Mocked_ETH_Account,
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
      },
    });

    expect(result.current.detailedAccounts).toEqual([
      {
        id: "js:2:ethereum:0x823ePB4bDa11da33a7F1C907D1171e5995Fe33c7:",
        name: "Ethereum",
        balance: "1 ETH",
        fiatValue: "$0.00",
        ticker: "ETH",
        protocol: "legacy",
        cryptoId: "ethereum",
        address: "freshAddress",
        parentId: undefined,
      },
    ]);
  });

  it('should return onAddAccountClick function that dispatches "ADD_ACCOUNT" action', () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: Mocked_ETH_Account,
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
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
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: Mocked_ETH_Account,
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
      },
    });

    expect(result.current.accounts).toEqual([
      {
        account: {
          type: "Account",
          id: "js:2:ethereum:0x823ePB4bDa11da33a7F1C907D1171e5995Fe33c7:",
          used: true,
          seedIdentifier: "",
          derivationMode: "ethM",
          index: 2,
          freshAddress: "freshAddress",
          freshAddressPath: "",
          blockHeight: 20372078,
          creationDate: Mocked_ETH_Account[0].creationDate,
          balance: Mocked_ETH_Account[0].balance,
          spendableBalance: Mocked_ETH_Account[0].spendableBalance,
          operations: [],
          operationsCount: 0,
          pendingOperations: [],
          currency: Mocked_ETH_Account[0].currency,
          lastSyncDate: Mocked_ETH_Account[0].lastSyncDate,
          swapHistory: [],
          syncHash: "",
          balanceHistoryCache: Mocked_ETH_Account[0].balanceHistoryCache,
          subAccounts: [],
          nfts: [],
        },
        subAccount: null,
      },
    ]);
  });
});
