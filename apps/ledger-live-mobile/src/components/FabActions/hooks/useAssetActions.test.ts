import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import useAssetActions from "./useAssetActions";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";
import { aleoTokenCurrency } from "~/families/aleo/__mocks__/currency.mock";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ name: "Asset", key: "asset-key", params: {} }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("~/generated/accountActions", () => ({
  __esModule: true,
  default: {
    aleo: {
      getAdditionalAssetActions: jest.fn(() => [{ id: "custom-action", label: "Custom" }]),
    },
  },
}));

jest.mock("~/screens/SendFunds/utils/customSendFlow", () => ({
  getCustomSendFlow: jest.fn(() => null),
}));

const mockGetCustomSendFlow = jest.mocked(getCustomSendFlow);
const currencyAleo = getCryptoCurrencyById("aleo");
const ALEO_ACCOUNT_1 = genAccount("asset-actions-aleo-1", {
  currency: currencyAleo,
  operationsSize: 3,
});
const ALEO_ACCOUNT_2 = genAccount("asset-actions-aleo-2", {
  currency: currencyAleo,
  operationsSize: 3,
});

const withSingleAccount = (state: State): State => ({
  ...state,
  settings: { ...state.settings, readOnlyModeEnabled: false },
  accounts: { active: [ALEO_ACCOUNT_1] },
});

const withTwoAccounts = (state: State): State => ({
  ...state,
  settings: { ...state.settings, readOnlyModeEnabled: false },
  accounts: { active: [ALEO_ACCOUNT_1, ALEO_ACCOUNT_2] },
});

describe("useAssetActions - custom send flow", () => {
  beforeEach(() => {
    mockGetCustomSendFlow.mockClear();
    mockGetCustomSendFlow.mockReturnValue(null);
  });

  it("uses buildSendEntrypoint when the family has a custom send flow", () => {
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      buildSendEntrypoint: jest.fn(() => ({
        screen: ScreenName.AleoSendBalanceSelection,
        params: {},
      })),
    });

    const { result } = renderHook(
      () => useAssetActions({ currency: currencyAleo, accounts: [ALEO_ACCOUNT_1] }),
      { overrideInitialState: withSingleAccount },
    );

    const sendAction = result.current.mainActions.find(a => a.id === "send");

    expect(sendAction?.navigationParams?.[1]).toMatchObject({
      screen: ScreenName.AleoSendBalanceSelection,
    });
  });

  it("uses SendSelectRecipient with accountId when 1 account and no custom flow", () => {
    const { result } = renderHook(
      () => useAssetActions({ currency: currencyAleo, accounts: [ALEO_ACCOUNT_1] }),
      { overrideInitialState: withSingleAccount },
    );

    const sendAction = result.current.mainActions.find(a => a.id === "send");

    expect(sendAction?.navigationParams?.[1]).toMatchObject({
      screen: ScreenName.SendSelectRecipient,
      params: expect.objectContaining({ accountId: ALEO_ACCOUNT_1.id }),
    });
  });

  it("uses SendCoin with selectedCurrency when there is no single default account", () => {
    const { result } = renderHook(
      () => useAssetActions({ currency: currencyAleo, accounts: [ALEO_ACCOUNT_1, ALEO_ACCOUNT_2] }),
      { overrideInitialState: withTwoAccounts },
    );

    const sendAction = result.current.mainActions.find(a => a.id === "send");

    expect(sendAction?.navigationParams?.[1]).toMatchObject({
      screen: ScreenName.SendCoin,
      params: expect.objectContaining({ selectedCurrency: currencyAleo }),
    });
  });

  it("resolves family from the parent currency when currency is a token", () => {
    renderHook(() => useAssetActions({ currency: aleoTokenCurrency, accounts: [ALEO_ACCOUNT_1] }), {
      overrideInitialState: withSingleAccount,
    });

    expect(mockGetCustomSendFlow).toHaveBeenCalledWith("aleo");
  });

  it("includes additional family actions from getAdditionalAssetActions", () => {
    const { result } = renderHook(
      () => useAssetActions({ currency: currencyAleo, accounts: [ALEO_ACCOUNT_1] }),
      { overrideInitialState: withSingleAccount },
    );

    expect(result.current.mainActions).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "custom-action" })]),
    );
  });

  it("omits send and receive for a family that disables them (hypercore)", () => {
    const currencyHypercore = getCryptoCurrencyById("hypercore");

    const { result } = renderHook(
      () => useAssetActions({ currency: currencyHypercore, accounts: [ALEO_ACCOUNT_1] }),
      { overrideInitialState: withSingleAccount },
    );

    expect(result.current.mainActions.find(a => a.id === "send")).toBeUndefined();
    expect(result.current.mainActions.find(a => a.id === "receive")).toBeUndefined();
  });
});
