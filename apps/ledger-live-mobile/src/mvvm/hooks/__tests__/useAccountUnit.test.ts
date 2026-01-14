/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@tests/test-renderer";
import { useAccountUnit, useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { State } from "~/reducers/types";
import { AccountRaw, TokenAccount } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const parentAccountRaw: AccountRaw = {
  id: "js:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  name: "Ethereum Account",
  derivationMode: "",
  index: 0,
  freshAddress: "0x01",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 8168983,
  operations: [],
  pendingOperations: [],
  currencyId: "ethereum",
  lastSyncDate: "2019-07-17T15:13:30.318Z",
  balance: "1000000000000000000",
};

setupMockCryptoAssetsStore();

let mockParentAccount: Awaited<ReturnType<typeof fromAccountRaw>>;

const mockTokenAccount: TokenAccount = {
  type: "TokenAccount",
  id: "js:2:ethereum:0x01:usdt:",
  parentId: "js:2:ethereum:0x01:",
  token: {
    type: "TokenCurrency",
    id: "ethereum/erc20/usd_tether__erc20_",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    parentCurrency: {
      id: "ethereum",
      type: "CryptoCurrency",
    } as CryptoCurrency,
    tokenType: "erc20",
    name: "Tether USD",
    ticker: "USDT",
    units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
  },
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  creationDate: new Date(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    WEEK: { latestDate: null, balances: [] },
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

beforeAll(async () => {
  mockParentAccount = await fromAccountRaw(parentAccountRaw);
});

describe("useAccountUnit", () => {
  describe("when account is a main account", () => {
    it("should return a defined unit", () => {
      const { result } = renderHook(() => useAccountUnit(mockParentAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current).toBeDefined();
    });

    it("should return ETH as unit code", () => {
      const { result } = renderHook(() => useAccountUnit(mockParentAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current.code).toBe("ETH");
    });
  });

  describe("when account is a token account", () => {
    it("should return a defined unit", () => {
      const { result } = renderHook(() => useAccountUnit(mockTokenAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current).toBeDefined();
    });

    it("should return USDT as unit code", () => {
      const { result } = renderHook(() => useAccountUnit(mockTokenAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current.code).toBe("USDT");
    });
  });
});

describe("useMaybeAccountUnit", () => {
  describe("when account is undefined", () => {
    it("should return undefined", () => {
      const { result } = renderHook(() => useMaybeAccountUnit(undefined));
      expect(result.current).toBeUndefined();
    });
  });

  describe("when account is null", () => {
    it("should return undefined", () => {
      const { result } = renderHook(() => useMaybeAccountUnit(null));
      expect(result.current).toBeUndefined();
    });
  });

  describe("when account is provided", () => {
    it("should return a defined unit", () => {
      const { result } = renderHook(() => useMaybeAccountUnit(mockParentAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current).toBeDefined();
    });

    it("should return ETH as unit code", () => {
      const { result } = renderHook(() => useMaybeAccountUnit(mockParentAccount), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockParentAccount],
          },
        }),
      });
      expect(result.current?.code).toBe("ETH");
    });
  });
});
