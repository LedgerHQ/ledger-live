/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@tests/test-renderer";
import {
  useAccountsByCryptoCurrency,
  useFlattenAccountsByCryptoCurrency,
} from "LLM/hooks/useAccountsByCryptoCurrency";
import { State } from "~/reducers/types";
import { AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const ethereumAccountRaw: AccountRaw = {
  id: "js:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  name: "Ethereum Account 1",
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

const ethereumAccount2Raw: AccountRaw = {
  id: "js:2:ethereum:0x02:",
  seedIdentifier: "0x02",
  name: "Ethereum Account 2",
  derivationMode: "",
  index: 1,
  freshAddress: "0x02",
  freshAddressPath: "44'/60'/0'/0/1",
  blockHeight: 8168983,
  operations: [],
  pendingOperations: [],
  currencyId: "ethereum",
  lastSyncDate: "2019-07-17T15:13:30.318Z",
  balance: "2000000000000000000",
};

const bitcoinAccountRaw: AccountRaw = {
  id: "js:2:bitcoin:xpub:",
  seedIdentifier: "xpub",
  name: "Bitcoin Account",
  derivationMode: "native_segwit",
  index: 0,
  freshAddress: "bc1q",
  freshAddressPath: "84'/0'/0'/0/0",
  blockHeight: 800000,
  operations: [],
  pendingOperations: [],
  currencyId: "bitcoin",
  lastSyncDate: "2019-07-17T15:13:30.318Z",
  balance: "100000000",
};

setupMockCryptoAssetsStore();

let mockEthereumAccount1: Awaited<ReturnType<typeof fromAccountRaw>>;
let mockEthereumAccount2: Awaited<ReturnType<typeof fromAccountRaw>>;
let mockBitcoinAccount: Awaited<ReturnType<typeof fromAccountRaw>>;

beforeAll(async () => {
  mockEthereumAccount1 = await fromAccountRaw(ethereumAccountRaw);
  mockEthereumAccount2 = await fromAccountRaw(ethereumAccount2Raw);
  mockBitcoinAccount = await fromAccountRaw(bitcoinAccountRaw);
});

describe("useAccountsByCryptoCurrency", () => {
  describe("when accounts exist for the currency", () => {
    it("should return correct number of accounts", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useAccountsByCryptoCurrency(ethereum), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1, mockEthereumAccount2, mockBitcoinAccount],
          },
        }),
      });
      expect(result.current).toHaveLength(2);
    });

    it("should return tuples with account property", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useAccountsByCryptoCurrency(ethereum), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1, mockEthereumAccount2, mockBitcoinAccount],
          },
        }),
      });
      expect(result.current[0]).toHaveProperty("account");
    });

    it("should return tuples with name property", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useAccountsByCryptoCurrency(ethereum), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1, mockEthereumAccount2, mockBitcoinAccount],
          },
        }),
      });
      expect(result.current[0]).toHaveProperty("name");
    });
  });

  describe("when no accounts match the currency", () => {
    it("should return empty array", () => {
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const { result } = renderHook(() => useAccountsByCryptoCurrency(bitcoin), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1],
          },
        }),
      });
      expect(result.current).toHaveLength(0);
    });
  });
});

describe("useFlattenAccountsByCryptoCurrency", () => {
  describe("when accounts exist for the currency", () => {
    it("should return at least 2 accounts", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const { result } = renderHook(() => useFlattenAccountsByCryptoCurrency(ethereum), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1, mockEthereumAccount2],
          },
        }),
      });
      expect(result.current.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("when currency is undefined", () => {
    it("should return empty array when no accounts exist", () => {
      const { result } = renderHook(() => useFlattenAccountsByCryptoCurrency(undefined), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [],
          },
        }),
      });
      expect(result.current).toHaveLength(0);
    });

    it("should return an array", () => {
      const { result } = renderHook(() => useFlattenAccountsByCryptoCurrency(undefined), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [mockEthereumAccount1, mockBitcoinAccount],
          },
        }),
      });
      expect(Array.isArray(result.current)).toBe(true);
    });
  });
});
