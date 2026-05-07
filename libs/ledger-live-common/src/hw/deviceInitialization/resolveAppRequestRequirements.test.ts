import {
  resolveAppRequestRequirements,
  toConnectAppInitializationInput,
  toConnectAppRequest,
} from "./resolveAppRequestRequirements";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";

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

const mockGetDerivationModesForCurrency = jest.mocked(getDerivationModesForCurrency);
const mockGetDerivationScheme = jest.mocked(getDerivationScheme);
const mockRunDerivationScheme = jest.mocked(runDerivationScheme);
const mockLoadAccountModuleForFamily = jest.mocked(loadAccountModuleForFamily);

const ethereumCurrency = getCryptoCurrencyById("ethereum");
const bitcoinCashCurrency = getCryptoCurrencyById("bitcoin_cash");

describe("deviceInitialization requirements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDerivationModesForCurrency.mockReturnValue(["ethM", ""]);
    mockGetDerivationScheme.mockReturnValue("mock-scheme");
    mockRunDerivationScheme.mockReturnValue("44'/60'/0'/0/0");
    mockLoadAccountModuleForFamily.mockReturnValue(undefined);
  });

  it("resolves account-only input from account data", async () => {
    const account = createFixtureAccount("01", ethereumCurrency);
    account.derivationMode = "ethM";
    account.freshAddressPath = "44'/60'/1'/0/0";

    await expect(resolveAppRequestRequirements({ account })).resolves.toEqual({
      appName: "Ethereum",
      dependencies: undefined,
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "ethM",
        path: "44'/60'/1'/0/0",
      },
    });
    expect(mockLoadAccountModuleForFamily).toHaveBeenCalledWith("evm");
    expect(mockGetDerivationModesForCurrency).not.toHaveBeenCalled();
  });

  it("resolves currency-only input with the default derivation path", async () => {
    await expect(resolveAppRequestRequirements({ currency: ethereumCurrency })).resolves.toEqual({
      appName: "Ethereum",
      dependencies: undefined,
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "",
        path: "44'/60'/0'/0/0",
      },
    });
    expect(mockGetDerivationModesForCurrency).toHaveBeenCalledWith(ethereumCurrency);
    expect(mockGetDerivationScheme).toHaveBeenCalledWith({
      currency: ethereumCurrency,
      derivationMode: "",
    });
    expect(mockRunDerivationScheme).toHaveBeenCalledWith("mock-scheme", ethereumCurrency);
  });

  it("resolves appName-only input without derivation", async () => {
    await expect(resolveAppRequestRequirements({ appName: "Ethereum" })).resolves.toEqual({
      appName: "Ethereum",
      dependencies: undefined,
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
    });
  });

  it("resolves nested dependencies recursively", async () => {
    const account = createFixtureAccount("02", ethereumCurrency);
    account.derivationMode = "ethM";
    account.freshAddressPath = "44'/60'/0'/0/0";

    await expect(
      resolveAppRequestRequirements({
        account,
        dependencies: [{ appName: "BOLOS" }, { currency: ethereumCurrency }],
      }),
    ).resolves.toEqual({
      appName: "Ethereum",
      dependencies: ["BOLOS", "Ethereum"],
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "ethM",
        path: "44'/60'/0'/0/0",
      },
    });
  });

  it("preserves allowPartialDependencies and requireLatestFirmware", async () => {
    await expect(
      resolveAppRequestRequirements({
        appName: "Exchange",
        allowPartialDependencies: true,
        requireLatestFirmware: true,
      }),
    ).resolves.toEqual({
      appName: "Exchange",
      dependencies: undefined,
      requireLatestFirmware: true,
      allowPartialDependencies: true,
    });
  });

  it("includes family-specific injected address params", async () => {
    mockLoadAccountModuleForFamily.mockReturnValue({
      injectGetAddressParams: jest.fn(() => ({ forceFormat: "cashaddr" })),
    });

    const account = createFixtureAccount("03", bitcoinCashCurrency);
    account.derivationMode = "unsplit";
    account.freshAddressPath = "44'/145'/0'/0/0";

    await expect(resolveAppRequestRequirements({ account })).resolves.toEqual({
      appName: "Bitcoin Cash",
      dependencies: undefined,
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
      requiresDerivation: {
        currencyId: "bitcoin_cash",
        derivationMode: "unsplit",
        forceFormat: "cashaddr",
        path: "44'/145'/0'/0/0",
      },
    });
  });

  it("keeps legacy request optionality while normalizing the DIE input", async () => {
    const resolved = await resolveAppRequestRequirements({
      appName: "Ethereum",
    });

    expect(toConnectAppRequest(resolved)).toEqual({
      appName: "Ethereum",
      dependencies: undefined,
      requireLatestFirmware: undefined,
      allowPartialDependencies: false,
      requiresDerivation: undefined,
    });

    expect(toConnectAppInitializationInput(resolved)).toEqual({
      appName: "Ethereum",
      dependencies: [],
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      requiresDerivation: undefined,
    });
  });
});
