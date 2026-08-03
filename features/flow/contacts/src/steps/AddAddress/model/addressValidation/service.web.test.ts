import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { createContactsAddressValidationService } from "./service";
import type { ContactsAddressValidationDependencies } from "./types";

const RAW_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const RESOLVED_ADDRESS = "0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const ETHEREUM = getCryptoCurrencyById("ethereum");
const TOKEN = mockTokenCurrency({ parentCurrencyId: ETHEREUM.id });

function createDependencies(overrides: Partial<ContactsAddressValidationDependencies> = {}) {
  const validateNetworkAddress = jest.fn().mockResolvedValue(true);
  const dependencies = {
    findTokenById: jest.fn().mockResolvedValue(undefined),
    supportsDomain: jest.fn().mockReturnValue(false),
    isEnsDomain: jest.fn().mockResolvedValue(false),
    validateDomain: jest.fn().mockReturnValue(true),
    resolveEnsDomain: jest.fn().mockResolvedValue(null),
    validateNetworkAddress,
    isAddressSanctioned: jest.fn().mockResolvedValue(false),
    ...overrides,
  } satisfies ContactsAddressValidationDependencies;

  return { dependencies, validateNetworkAddress };
}

describe("createContactsAddressValidationService", () => {
  it("should validate a native currency address with its network", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies();
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({
      status: "valid",
      resolvedAddress: RAW_ADDRESS,
      isDomain: false,
    });
    expect(validateNetworkAddress).toHaveBeenCalledWith({
      network: ETHEREUM,
      address: RAW_ADDRESS,
    });
  });

  it("should expose invalid_format when network validation rejects the address", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies();
    validateNetworkAddress.mockResolvedValue(false);
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "invalid" }),
    ).resolves.toEqual({ status: "invalid_format", isDomain: false });
  });

  it("should expose sanctioned after a valid raw address validation", async () => {
    const { dependencies } = createDependencies({
      isAddressSanctioned: jest.fn().mockResolvedValue(true),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({ status: "sanctioned" });
    expect(dependencies.isAddressSanctioned).toHaveBeenCalledWith(ETHEREUM, RAW_ADDRESS);
  });

  it("should use a token parent network and check domain support on the token", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies({
      findTokenById: jest.fn().mockResolvedValue(TOKEN),
    });
    const service = createContactsAddressValidationService(dependencies);

    await service.validateAddress({ currencyId: TOKEN.id, address: RAW_ADDRESS });

    expect(dependencies.findTokenById).toHaveBeenCalledWith(TOKEN.id);
    expect(dependencies.supportsDomain).toHaveBeenCalledWith(TOKEN);
    expect(validateNetworkAddress).toHaveBeenCalledWith({
      network: ETHEREUM,
      address: RAW_ADDRESS,
    });
  });

  it("should expose unavailable when the currency cannot be resolved", async () => {
    const { dependencies } = createDependencies();
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: TOKEN.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(dependencies.validateNetworkAddress).not.toHaveBeenCalled();
  });

  it("should expose unavailable when a token parent network cannot be resolved", async () => {
    const tokenWithoutNetwork = mockTokenCurrency({
      parentCurrencyId: "unknown" as CryptoCurrency["id"],
    });
    const { dependencies } = createDependencies({
      findTokenById: jest.fn().mockResolvedValue(tokenWithoutNetwork),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: tokenWithoutNetwork.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should expose unavailable when token lookup fails technically", async () => {
    const { dependencies } = createDependencies({
      findTokenById: jest.fn().mockRejectedValue(new Error("token lookup unavailable")),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: TOKEN.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should expose unavailable when network validation fails technically", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies();
    validateNetworkAddress.mockRejectedValue(new Error("bridge unavailable"));
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: RAW_ADDRESS }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should resolve and validate a normalized ENS domain", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
      resolveEnsDomain: jest.fn().mockResolvedValue(RESOLVED_ADDRESS),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "Ledger.ETH" }),
    ).resolves.toEqual({
      status: "valid",
      resolvedAddress: RESOLVED_ADDRESS,
      isDomain: true,
    });
    expect(dependencies.isEnsDomain).toHaveBeenCalledWith("ledger.eth");
    expect(dependencies.validateDomain).toHaveBeenCalledWith("ledger.eth");
    expect(dependencies.resolveEnsDomain).toHaveBeenCalledWith("ledger.eth");
    expect(validateNetworkAddress).toHaveBeenCalledWith({
      network: ETHEREUM,
      address: RESOLVED_ADDRESS,
    });
  });

  it("should check the resolved ENS address for sanctions", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
      resolveEnsDomain: jest.fn().mockResolvedValue(RESOLVED_ADDRESS),
      isAddressSanctioned: jest.fn().mockResolvedValue(true),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "ledger.eth" }),
    ).resolves.toEqual({ status: "sanctioned" });
    expect(dependencies.isAddressSanctioned).toHaveBeenCalledWith(ETHEREUM, RESOLVED_ADDRESS);
  });

  it("should expose domain_not_found when an ENS domain has no resolution", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "missing.eth" }),
    ).resolves.toEqual({ status: "domain_not_found" });
    expect(dependencies.validateNetworkAddress).not.toHaveBeenCalled();
  });

  it("should preserve ENS provenance when the resolved address has an invalid format", async () => {
    const { dependencies, validateNetworkAddress } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
      resolveEnsDomain: jest.fn().mockResolvedValue(RESOLVED_ADDRESS),
    });
    validateNetworkAddress.mockResolvedValue(false);
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "ledger.eth" }),
    ).resolves.toEqual({ status: "invalid_format", isDomain: true });
  });

  it("should expose domain_not_found for an unsafe ENS domain", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
      validateDomain: jest.fn().mockReturnValue(false),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "unsafe.eth" }),
    ).resolves.toEqual({ status: "domain_not_found" });
    expect(dependencies.resolveEnsDomain).not.toHaveBeenCalled();
  });

  it("should expose unavailable when domain resolution fails technically", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockResolvedValue(true),
      resolveEnsDomain: jest.fn().mockRejectedValue(new Error("domain service unavailable")),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "ledger.eth" }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should expose unavailable when domain detection fails technically", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
      isEnsDomain: jest.fn().mockRejectedValue(new Error("registry unavailable")),
    });
    const service = createContactsAddressValidationService(dependencies);

    await expect(
      service.validateAddress({ currencyId: ETHEREUM.id, address: "ledger.eth" }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("should validate a raw address without domain resolution", async () => {
    const { dependencies } = createDependencies({
      supportsDomain: jest.fn().mockReturnValue(true),
    });
    const service = createContactsAddressValidationService(dependencies);

    await service.validateAddress({ currencyId: ETHEREUM.id, address: RAW_ADDRESS });

    expect(dependencies.isEnsDomain).toHaveBeenCalledWith(RAW_ADDRESS.toLowerCase());
    expect(dependencies.resolveEnsDomain).not.toHaveBeenCalled();
  });
});
