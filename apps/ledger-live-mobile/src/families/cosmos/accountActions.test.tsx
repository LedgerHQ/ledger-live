import BigNumber from "bignumber.js";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { ScreenName } from "~/const";
import cosmosAccountActions from "./accountActions";

const parentRoute = {
  key: "k",
  name: ScreenName.Account,
} as unknown as RouteProp<ParamListBase, ScreenName>;

jest.mock("@ledgerhq/live-common/config/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/config/index"),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getStakeLabelLocaleBased: () => "account.earn",
}));

const makeAccount = (): CosmosAccount =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById("cosmos"),
    spendableBalance: new BigNumber(0),
    cosmosResources: undefined,
  }) as unknown as CosmosAccount;

function mockGetCurrencyConfiguration(currencyConfig: Record<string, unknown>) {
  jest
    .spyOn(config, "getCurrencyConfiguration")
    .mockReturnValue(currencyConfig as unknown as CurrencyConfig);
}

function mockGetCurrencyConfigurationThrowing() {
  jest.spyOn(config, "getCurrencyConfiguration").mockImplementation(() => {
    throw new Error("No currency configuration available for cosmos");
  });
}

describe("cosmos accountActions.getMainActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns no actions when the currency config disables delegation", () => {
    mockGetCurrencyConfiguration({ disableDelegation: true });
    const account = makeAccount();

    const actions = cosmosAccountActions.getMainActions({
      account,
      parentAccount: undefined,
      parentRoute,
    });

    expect(actions).toEqual([]);
  });

  it("still returns the stake action when disableDelegation is false", () => {
    mockGetCurrencyConfiguration({ disableDelegation: false });
    const account = makeAccount();

    const actions = cosmosAccountActions.getMainActions({
      account,
      parentAccount: undefined,
      parentRoute,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: "stake" });
  });

  it("still returns the stake action when the config carries no disableDelegation key", () => {
    // Most Cosmos chains don't set this key at all — the `in` narrowing must not misfire on them.
    mockGetCurrencyConfiguration({});
    const account = makeAccount();

    const actions = cosmosAccountActions.getMainActions({
      account,
      parentAccount: undefined,
      parentRoute,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: "stake" });
  });

  it("keeps the stake action and does not throw when the currency has no config entry", () => {
    // Regression guard: before the disableDelegation gate existed this function never called
    // getCurrencyConfiguration, so it could not throw. It throws on an absent config key, and
    // `crypto_org_croeseid` is in the cosmos supportedCoins list with no config entry. This
    // decorator also feeds the staking drawer, where nothing else would catch it.
    mockGetCurrencyConfigurationThrowing();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const account = makeAccount();

    const actions = cosmosAccountActions.getMainActions({
      account,
      parentAccount: undefined,
      parentRoute,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ id: "stake" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
