import { getRegistries } from "@ledgerhq/domain-service/registries/index";
import * as cryptoAssetsStore from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { createContactsAddressValidationDependencies } from "./contactsAddressValidationDependencies";

type MobileDependencies = NonNullable<
  Parameters<typeof createContactsAddressValidationDependencies>[0]
>;

const ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const ETHEREUM = getCryptoCurrencyById("ethereum");
const TRON = getCryptoCurrencyById("tron");

function createMobileDependencies(overrides: Partial<MobileDependencies> = {}) {
  const validateAddress = jest.fn().mockResolvedValue(true);
  const dependencies = {
    findTokenById: jest.fn().mockResolvedValue(undefined),
    getAccountBridgeByFamily: jest.fn().mockResolvedValue({ validateAddress }),
    supportsDomain: jest.fn().mockReturnValue(true),
    getRegistriesForDomain: jest.fn().mockResolvedValue([]),
    resolveDomain: jest.fn().mockResolvedValue([]),
    validateDomain: jest.fn().mockReturnValue(true),
    ...overrides,
  } satisfies MobileDependencies;

  return { dependencies, validateAddress };
}

describe("createContactsAddressValidationDependencies", () => {
  it("should expose the Mobile currency and domain capabilities", () => {
    const { dependencies } = createMobileDependencies();
    const adapter = createContactsAddressValidationDependencies(dependencies);

    expect(adapter.findTokenById).toBe(dependencies.findTokenById);
    expect(adapter.supportsDomain).toBe(dependencies.supportsDomain);
    expect(adapter.validateDomain).toBe(dependencies.validateDomain);
  });

  it("should wire token lookup to the crypto-assets store by default", async () => {
    const token = mockTokenCurrency();
    const findTokenById = jest.fn().mockResolvedValue(token);
    jest.spyOn(cryptoAssetsStore, "getCryptoAssetsStore").mockReturnValue({
      findTokenById,
      findTokenByAddressInCurrency: jest.fn(),
      getTokensSyncHash: jest.fn(),
    });
    const adapter = createContactsAddressValidationDependencies();

    await expect(adapter.findTokenById(token.id)).resolves.toBe(token);
    expect(findTokenById).toHaveBeenCalledWith(token.id);
  });

  it("should detect ENS using the Mobile domain registry", async () => {
    const registries = await getRegistries();
    const { dependencies } = createMobileDependencies({
      getRegistriesForDomain: jest.fn().mockResolvedValue(registries),
    });
    const adapter = createContactsAddressValidationDependencies(dependencies);

    await expect(adapter.isEnsDomain("ledger.eth")).resolves.toBe(true);
    expect(dependencies.getRegistriesForDomain).toHaveBeenCalledWith("ledger.eth");
  });

  it("should expose the first ENS resolution address", async () => {
    const { dependencies } = createMobileDependencies({
      resolveDomain: jest.fn().mockResolvedValue([
        {
          registry: "ens",
          address: ADDRESS,
          domain: "ledger.eth",
          type: "forward",
        },
      ]),
    });
    const adapter = createContactsAddressValidationDependencies(dependencies);

    await expect(adapter.resolveEnsDomain("ledger.eth")).resolves.toBe(ADDRESS);
    expect(dependencies.resolveDomain).toHaveBeenCalledWith("ledger.eth", "ens");
  });

  it("should expose null when ENS has no resolution", async () => {
    const { dependencies } = createMobileDependencies();
    const adapter = createContactsAddressValidationDependencies(dependencies);

    await expect(adapter.resolveEnsDomain("missing.eth")).resolves.toBeNull();
  });

  it.each([ETHEREUM, TRON])(
    "should validate $id using its family and currency ID",
    async network => {
      const { dependencies, validateAddress } = createMobileDependencies();
      const adapter = createContactsAddressValidationDependencies(dependencies);

      await adapter.validateNetworkAddress({ network, address: ADDRESS });

      expect(dependencies.getAccountBridgeByFamily).toHaveBeenCalledWith(network.family);
      expect(validateAddress).toHaveBeenCalledWith(ADDRESS, {
        currencyId: network.id,
      });
    },
  );

  it("should propagate bridge loading failures to the Flow service", async () => {
    const { dependencies } = createMobileDependencies({
      getAccountBridgeByFamily: jest.fn().mockRejectedValue(new Error("bridge unavailable")),
    });
    const adapter = createContactsAddressValidationDependencies(dependencies);

    await expect(
      adapter.validateNetworkAddress({ network: ETHEREUM, address: ADDRESS }),
    ).rejects.toThrow("bridge unavailable");
  });
});
