/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@tests/test-renderer";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { State } from "~/reducers/types";
import { AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

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

beforeAll(async () => {
  mockParentAccount = await fromAccountRaw(parentAccountRaw);
});

describe("useAccountScreen", () => {
  describe("when route is undefined", () => {
    it("should return undefined account", () => {
      const { result } = renderHook(() => useAccountScreen(undefined));
      expect(result.current.account).toBeUndefined();
    });

    it("should return falsy parentAccount", () => {
      const { result } = renderHook(() => useAccountScreen(undefined));
      expect(result.current.parentAccount).toBeFalsy();
    });
  });

  describe("when route.params is undefined", () => {
    it("should return undefined account", () => {
      const { result } = renderHook(() => useAccountScreen({ params: undefined }));
      expect(result.current.account).toBeUndefined();
    });

    it("should return falsy parentAccount", () => {
      const { result } = renderHook(() => useAccountScreen({ params: undefined }));
      expect(result.current.parentAccount).toBeFalsy();
    });
  });

  describe("when account is provided directly in route params", () => {
    it("should return the provided account", () => {
      const { result } = renderHook(() =>
        useAccountScreen({
          params: {
            account: mockParentAccount,
          },
        }),
      );
      expect(result.current.account).toBe(mockParentAccount);
    });
  });

  describe("when accountId is provided", () => {
    it("should return account from store matching the accountId", () => {
      const { result } = renderHook(
        () =>
          useAccountScreen({
            params: {
              accountId: mockParentAccount.id,
            },
          }),
        {
          overrideInitialState: (state: State) => ({
            ...state,
            accounts: {
              ...state.accounts,
              active: [mockParentAccount],
            },
          }),
        },
      );
      expect(result.current.account?.id).toBe(mockParentAccount.id);
    });

    it("should return undefined when accountId does not match any account", () => {
      const { result } = renderHook(
        () =>
          useAccountScreen({
            params: {
              accountId: "non-existent-id",
            },
          }),
        {
          overrideInitialState: (state: State) => ({
            ...state,
            accounts: {
              ...state.accounts,
              active: [mockParentAccount],
            },
          }),
        },
      );
      expect(result.current.account).toBeUndefined();
    });
  });
});
