import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { isSwapDisableAppsInstall } from "../swap/utils/isIntegrationTestEnv";
import { buildExchangeAppRequest, getExchangeMainAccounts } from "./exchangeAppRequest";

jest.mock("../swap/utils/isIntegrationTestEnv", () => ({ isSwapDisableAppsInstall: jest.fn() }));

function accountOf(currencyId: string): Account {
  return {
    type: "Account",
    id: currencyId,
    currency: getCryptoCurrencyById(currencyId),
  } as Account;
}

const bitcoin = accountOf("bitcoin");
const ethereum = accountOf("ethereum");
const polygon = accountOf("polygon");

describe("buildExchangeAppRequest", () => {
  beforeEach(() => {
    jest.mocked(isSwapDisableAppsInstall).mockReturnValue(false);
  });

  it("opens the Exchange app with the coin app of each account", () => {
    expect(buildExchangeAppRequest({ mainFromAccount: bitcoin, mainToAccount: ethereum })).toEqual({
      appName: "Exchange",
      dependencies: [
        { appName: bitcoin.currency.managerAppName },
        { appName: ethereum.currency.managerAppName },
      ],
      requireLatestFirmware: true,
    });
  });

  it("only needs the coin app of the account being sold or funded", () => {
    expect(buildExchangeAppRequest({ mainFromAccount: bitcoin, mainToAccount: null })).toEqual({
      appName: "Exchange",
      dependencies: [{ appName: bitcoin.currency.managerAppName }],
      requireLatestFirmware: true,
    });
  });

  it("adds the Ethereum app for an EVM chain that has a coin app of its own", () => {
    const ethereumClassic = accountOf("ethereum_classic");

    expect(
      buildExchangeAppRequest({ mainFromAccount: bitcoin, mainToAccount: ethereumClassic }),
    ).toEqual({
      appName: "Exchange",
      dependencies: [
        { appName: bitcoin.currency.managerAppName },
        { appName: ethereumClassic.currency.managerAppName },
        { appName: "Ethereum" },
      ],
      requireLatestFirmware: true,
    });
  });

  it("does not add the Ethereum app when an account already uses it", () => {
    const { dependencies } = buildExchangeAppRequest({
      mainFromAccount: polygon,
      mainToAccount: bitcoin,
    });

    expect(dependencies).toEqual([
      { appName: polygon.currency.managerAppName },
      { appName: bitcoin.currency.managerAppName },
    ]);
  });

  it("only opens the Exchange app when apps are not to be installed", () => {
    jest.mocked(isSwapDisableAppsInstall).mockReturnValue(true);

    expect(buildExchangeAppRequest({ mainFromAccount: bitcoin, mainToAccount: ethereum })).toEqual({
      appName: "Exchange",
    });
  });
});

describe("getExchangeMainAccounts", () => {
  it("finds both accounts of a swap, through their parent for token accounts", () => {
    const tokenAccount = {
      type: "TokenAccount",
      id: "token",
      parentId: ethereum.id,
    } as unknown as Account;

    const { mainFromAccount, mainToAccount } = getExchangeMainAccounts({
      fromAccount: tokenAccount,
      fromParentAccount: ethereum,
      toAccount: bitcoin,
      toParentAccount: undefined,
    });

    expect(mainFromAccount).toBe(ethereum);
    expect(mainToAccount).toBe(bitcoin);
  });

  it("has no destination for a sell or fund", () => {
    expect(getExchangeMainAccounts({ fromAccount: bitcoin })).toEqual({
      mainFromAccount: bitcoin,
      mainToAccount: null,
    });
  });

  it("has no account before the live app picked one", () => {
    expect(getExchangeMainAccounts(undefined)).toEqual({
      mainFromAccount: null,
      mainToAccount: null,
    });
    expect(getExchangeMainAccounts({})).toEqual({ mainFromAccount: null, mainToAccount: null });
  });
});
