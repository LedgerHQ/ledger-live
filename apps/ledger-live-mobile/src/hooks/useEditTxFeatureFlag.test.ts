import { renderHook } from "@tests/test-renderer";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useEditTxFeatureFlag } from "./useEditTxFeatureFlag";

jest.mock("@ledgerhq/coin-framework/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account/helpers"),
  getMainAccount: jest.fn(),
}));

const mockedGetMainAccount = jest.mocked(getMainAccount);

describe("useEditTxFeatureFlag", () => {
  const account = { id: "account-id" };
  const parentAccount = { id: "parent-account-id" };
  const mainAccount = { currency: { id: "bitcoin" } };

  beforeEach(() => {
    mockedGetMainAccount.mockReturnValue(mainAccount as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns disabled and unsupported when feature is disabled", () => {
    const { result } = renderHook(
      () =>
        useEditTxFeatureFlag({
          featureKey: "editBitcoinTx",
          account: account as never,
          parentAccount: parentAccount as never,
        }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              editBitcoinTx: {
                enabled: false,
                params: {},
              },
            },
          },
        }),
      },
    );

    expect(mockedGetMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(result.current).toEqual({
      isEditTxEnabled: false,
      isCurrencySupported: false,
    });
  });

  it("returns enabled and supported when feature is enabled and currency is in allowlist", () => {
    const { result } = renderHook(
      () =>
        useEditTxFeatureFlag({
          featureKey: "editBitcoinTx",
          account: account as never,
          parentAccount: parentAccount as never,
        }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              editBitcoinTx: {
                enabled: true,
                params: { supportedCurrencyIds: ["bitcoin", "ethereum"] },
              },
            },
          },
        }),
      },
    );

    expect(result.current).toEqual({
      isEditTxEnabled: true,
      isCurrencySupported: true,
    });
  });

  it("returns unsupported when supported currencies are missing", () => {
    const { result } = renderHook(
      () =>
        useEditTxFeatureFlag({
          featureKey: "editEvmTx",
          account: account as never,
          parentAccount: parentAccount as never,
        }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              editEvmTx: {
                enabled: true,
                params: {},
              },
            },
          },
        }),
      },
    );

    expect(result.current).toEqual({
      isEditTxEnabled: true,
      isCurrencySupported: false,
    });
  });
});
