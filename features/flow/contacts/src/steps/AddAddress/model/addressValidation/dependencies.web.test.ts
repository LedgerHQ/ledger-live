import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createContactsAddressValidationDependencies } from "./dependencies";
import type { ContactsAddressValidationGateway } from "./types";

const ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const ETHEREUM = getCryptoCurrencyById("ethereum");
const TRON = getCryptoCurrencyById("tron");

function createGateway(overrides: Partial<ContactsAddressValidationGateway> = {}) {
  const validateAddress = jest.fn().mockResolvedValue(true);
  const gateway = {
    findTokenById: jest.fn().mockResolvedValue(undefined),
    supportsDomain: jest.fn().mockReturnValue(true),
    getRegistriesForDomain: jest.fn().mockResolvedValue([]),
    resolveDomain: jest.fn().mockResolvedValue([]),
    validateDomain: jest.fn().mockReturnValue(true),
    getAccountBridgeByFamily: jest.fn().mockResolvedValue({ validateAddress }),
    ...overrides,
  } satisfies ContactsAddressValidationGateway;

  return { gateway, validateAddress };
}

describe("createContactsAddressValidationDependencies", () => {
  it("should expose the injected currency and domain gateways", () => {
    const { gateway } = createGateway();
    const dependencies = createContactsAddressValidationDependencies(gateway);

    expect(dependencies.findTokenById).toBe(gateway.findTokenById);
    expect(dependencies.supportsDomain).toBe(gateway.supportsDomain);
    expect(dependencies.validateDomain).toBe(gateway.validateDomain);
  });

  it("should detect ENS from the injected domain registry", async () => {
    const { gateway } = createGateway({
      getRegistriesForDomain: jest.fn().mockResolvedValue([{ name: "ens" }]),
    });
    const dependencies = createContactsAddressValidationDependencies(gateway);

    await expect(dependencies.isEnsDomain("ledger.eth")).resolves.toBe(true);
  });

  it("should expose the first ENS resolution address", async () => {
    const { gateway } = createGateway({
      resolveDomain: jest.fn().mockResolvedValue([{ address: ADDRESS }]),
    });
    const dependencies = createContactsAddressValidationDependencies(gateway);

    await expect(dependencies.resolveEnsDomain("ledger.eth")).resolves.toBe(ADDRESS);
  });

  it.each([ETHEREUM, TRON])(
    "should validate $id through its family bridge with the network ID",
    async network => {
      const { gateway, validateAddress } = createGateway();
      const dependencies = createContactsAddressValidationDependencies(gateway);

      await dependencies.validateNetworkAddress({ network, address: ADDRESS });

      expect(gateway.getAccountBridgeByFamily).toHaveBeenCalledWith(network.family);
      expect(validateAddress).toHaveBeenCalledWith(ADDRESS, { currencyId: network.id });
    },
  );

  it("should preserve bridge loading failures for the validation service", async () => {
    const { gateway } = createGateway({
      getAccountBridgeByFamily: jest.fn().mockRejectedValue(new Error("bridge unavailable")),
    });
    const dependencies = createContactsAddressValidationDependencies(gateway);

    await expect(
      dependencies.validateNetworkAddress({ network: ETHEREUM, address: ADDRESS }),
    ).rejects.toThrow("bridge unavailable");
  });
});
