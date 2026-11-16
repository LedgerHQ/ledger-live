import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import { registerCoinModules, resetCoinModulesForTests } from "../coin-modules/registry";
import type { CoinModuleLoader } from "../coin-modules/types";
import { createCoinModuleValidatorsHost } from "./createCoinModuleValidatorsHost";

jest.mock("../config", () => ({ getCurrencyConfiguration: jest.fn(() => ({})) }));

const getValidators = jest.fn();
const createLocalApi = jest.fn();

const loader = (family: string, overrides: Partial<CoinModuleLoader>): CoinModuleLoader => ({
  family,
  supportedCoins: [],
  accountDescriptorType: "address",
  loadSetup: async () => ({}),
  loadTransaction: () => Promise.reject(new Error("not read by the host")),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetCoinModulesForTests();
  registerCoinModules([
    loader("cosmos", { supportedCoins: ["cosmos"], loadLocalApi: async () => createLocalApi }),
    loader("polkadot", { supportedCoins: ["polkadot"] }),
  ]);
});

afterAll(() => resetCoinModulesForTests());

describe("createCoinModuleValidatorsHost", () => {
  it("supports the currencies with a local coin module", () => {
    const host = createCoinModuleValidatorsHost();
    expect(host.isCurrencySupported("cosmos")).toBe(true);
    expect(host.isCurrencySupported("polkadot")).toBe(false);
  });

  it("pages the coin module's getValidators with the currency's context", async () => {
    createLocalApi.mockReturnValue({ getValidators });
    getValidators.mockResolvedValueOnce({ items: [{ id: "v" }], next: "2" });
    getValidators.mockResolvedValueOnce({ items: [], next: undefined });
    const api = await createCoinModuleValidatorsHost().getValidatorsApi("cosmos");
    await expect(api?.getValidators()).resolves.toEqual({ items: [{ id: "v" }], next: "2" });
    await expect(api?.getValidators("2")).resolves.toEqual({ items: [] });
    expect(getValidators).toHaveBeenLastCalledWith(
      expect.objectContaining({ config: expect.any(Function) }),
      { cursor: "2" },
    );
  });

  it("is undefined when the coin module does not list validators", async () => {
    createLocalApi.mockReturnValue({});
    await expect(
      createCoinModuleValidatorsHost().getValidatorsApi("cosmos"),
    ).resolves.toBeUndefined();
    createLocalApi.mockReturnValue({ getValidators: notSupported("getValidators") });
    await expect(
      createCoinModuleValidatorsHost().getValidatorsApi("cosmos"),
    ).resolves.toBeUndefined();
  });
});
