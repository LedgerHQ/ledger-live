import { renderHook } from "tests/testSetup";
import { useDetailedAccounts } from "../useDetailedAccounts";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { Account } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Mocked_ETH_Account } from "../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  useGetAccountIds: jest.fn(),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesState: jest.fn(),
}));

const mockTokenAccounts = [{ subAccount: { id: "2", balance: { comparedTo: () => 0 } } }];

(useGetAccountIds as jest.Mock).mockReturnValue(["1"]);
(useCountervaluesState as jest.Mock).mockReturnValue({});

jest.mock("../../utils/sortAccountsByFiatValue", () => ({
  sortAccountsByFiatValue: (accounts: Account) => accounts,
}));
jest.mock("../../utils/formatDetailedAccount", () => ({
  formatDetailedAccount: (account: Account) => ({ ...account, formatted: true }),
}));
jest.mock("LLD/utils/getTokenAccountTuples", () => ({
  getTokenAccountTuples: () => mockTokenAccounts,
}));
jest.mock("~/renderer/components/PerCurrencySelectAccount/state", () => ({
  getAccountTuplesForCurrency: () => [{ account: Mocked_ETH_Account[0] }],
}));
jest.mock("@ledgerhq/live-common/currencies/helpers", () => ({
  isTokenCurrency: (asset: CryptoOrTokenCurrency) => asset.type === "TokenCurrency",
}));
jest.mock("@ledgerhq/coin-framework/derivation", () => ({
  getTagDerivationMode: () => "protocolTag",
}));

describe("useDetailedAccounts", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
        type: "Account",
        id: "js:2:ethereum:0x823ePB4bDa11da33a7F1C907D1171e5995Fe33c7:",
        used: true,
        seedIdentifier: "",
        derivationMode: "",
        index: 2,
        freshAddress: "",
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
        formatted: true,
        protocol: "protocolTag",
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
          derivationMode: "",
          index: 2,
          freshAddress: "",
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
      },
    ]);
  });
});
