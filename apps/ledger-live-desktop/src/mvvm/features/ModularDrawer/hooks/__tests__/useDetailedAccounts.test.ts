import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { mockDispatch } from "../../../__tests__/shared";
import { useDetailedAccounts } from "../useDetailedAccounts";

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe("useDetailedAccounts", () => {
  it("should return formatted accounts for a crypto currency", () => {
    const asset = ethereumCurrency;
    const { result } = renderHook(() => useDetailedAccounts(asset), {
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
        address: "0x42D9B73CC5087B49B0DB4E505D9C26D1126339ED",
        balance: new BigNumber("12716111724790910655"),
        balanceUnit: {
          code: "ETH",
          magnitude: 18,
          name: "ether",
        },
        cryptoId: "ethereum",
        fiatValue: 0,
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
