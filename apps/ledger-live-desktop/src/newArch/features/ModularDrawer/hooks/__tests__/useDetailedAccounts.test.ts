import * as reactRedux from "react-redux";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { mockDispatch } from "../../../__tests__/shared";
import { useDetailedAccounts } from "../useDetailedAccounts";

jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);

describe("useDetailedAccounts", () => {
  it("should return formatted accounts for a crypto currency", () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow", "source"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
      },
    });

    expect(result.current.detailedAccounts).toEqual([
      {
        id: ETH_ACCOUNT.id,
        name: "Ethereum 2",
        address: "0x42D...339ED",
        balance: "12.7161 ETH",
        cryptoId: "ethereum",
        fiatValue: undefined,
        parentId: undefined,
        protocol: "",
        ticker: "ETH",
      },
    ]);
  });

  it('should return onAddAccountClick function that dispatches "ADD_ACCOUNT" action', () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow", "source"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
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
    const { result } = renderHook(() => useDetailedAccounts(asset, "flow", "source"), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
        wallet: { accountNames: new Map([["eth1", "eth1"]]) },
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
