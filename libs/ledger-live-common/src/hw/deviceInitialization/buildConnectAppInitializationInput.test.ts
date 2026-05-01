import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "../../mock/fixtures/cryptoCurrencies";
import { FlowName } from "../../device-action/utils";

jest.mock("@ledgerhq/ledger-wallet-framework/derivation", () => ({
  getDerivationScheme: jest.fn(() => "mock-scheme"),
  getDerivationModesForCurrency: jest.fn(() => ["ethM", ""]),
  runDerivationScheme: jest.fn(() => "44'/60'/0'/0/0"),
}));

jest.mock("../../coin-modules/registry", () => ({
  loadAccountModuleForFamily: jest.fn(() => undefined),
}));

import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { loadAccountModuleForFamily } from "../../coin-modules/registry";
import { buildConnectAppInitializationInput } from "./buildConnectAppInitializationInput";

const mockGetDerivationModesForCurrency = jest.mocked(getDerivationModesForCurrency);
const mockGetDerivationScheme = jest.mocked(getDerivationScheme);
const mockRunDerivationScheme = jest.mocked(runDerivationScheme);
const mockLoadAccountModuleForFamily = jest.mocked(loadAccountModuleForFamily);

const ethereumCurrency = getCryptoCurrencyById("ethereum");

describe("deviceInitialization buildConnectAppInitializationInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDerivationModesForCurrency.mockReturnValue(["ethM", ""]);
    mockGetDerivationScheme.mockReturnValue("mock-scheme");
    mockRunDerivationScheme.mockReturnValue("44'/60'/0'/0/0");
    mockLoadAccountModuleForFamily.mockReturnValue(undefined);
  });

  it("builds the initialization input from account data and flow metadata", async () => {
    const account = createFixtureAccount("01", ethereumCurrency);
    account.derivationMode = "ethM";
    account.freshAddress = "0xfresh";
    account.seedIdentifier = "0xseed";
    account.freshAddressPath = "44'/60'/1'/0/0";

    expect(
      await buildConnectAppInitializationInput({
        appRequest: { account },
        flow: FlowName.send,
      }),
    ).toEqual({
      appName: "Ethereum",
      dependencies: [],
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "ethM",
        path: "44'/60'/1'/0/0",
      },
      expectedAccount: {
        accountName: getDefaultAccountName(account),
        acceptableDerivedAddresses: ["0xfresh", "0xseed"],
      },
      deprecation: {
        flow: FlowName.send,
        currencyName: "Ethereum",
      },
    });
  });

  it("keeps account-derived requirements while skipping wrong-device validation when requested", async () => {
    const account = createFixtureAccount("02", ethereumCurrency);
    account.derivationMode = "ethM";
    account.freshAddressPath = "44'/60'/2'/0/0";

    expect(
      await buildConnectAppInitializationInput({
        appRequest: { account },
        skipWrongDeviceCheck: true,
      }),
    ).toEqual({
      appName: "Ethereum",
      dependencies: [],
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "ethM",
        path: "44'/60'/2'/0/0",
      },
      expectedAccount: undefined,
      deprecation: undefined,
    });
  });

  it("uses an explicit currency name override over request fallbacks", async () => {
    const tokenCurrency = createFixtureTokenAccount("11").token;

    expect(
      await buildConnectAppInitializationInput({
        appRequest: {
          appName: "Exchange",
          tokenCurrency,
        },
        flow: FlowName.swap,
        currencyName: "Custom Coin",
      }),
    ).toMatchObject({
      appName: "Exchange",
      deprecation: {
        flow: FlowName.swap,
        currencyName: "Custom Coin",
      },
    });
  });

  it("falls back from token currency to account currency to currency for deprecation naming", async () => {
    const account = createFixtureAccount("03", ethereumCurrency);
    const tokenCurrency = createFixtureTokenAccount("12").token;
    const tokenInput = await buildConnectAppInitializationInput({
      appRequest: {
        appName: "Exchange",
        tokenCurrency,
      },
      flow: FlowName.swap,
    });
    const accountInput = await buildConnectAppInitializationInput({
      appRequest: { account },
      flow: FlowName.receive,
    });
    const currencyInput = await buildConnectAppInitializationInput({
      appRequest: { currency: ethereumCurrency },
      flow: FlowName.addAccount,
    });

    expect(tokenInput.deprecation).toEqual({
      flow: FlowName.swap,
      currencyName: tokenCurrency.name,
    });

    expect(accountInput.deprecation).toEqual({
      flow: FlowName.receive,
      currencyName: "Ethereum",
    });

    expect(currencyInput.deprecation).toEqual({
      flow: FlowName.addAccount,
      currencyName: "Ethereum",
    });
  });
});
