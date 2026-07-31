import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type ContactsAddressValidationInput = Readonly<{
  currencyId: ContactAddress["currencyId"];
  address: string;
}>;

export type ContactsAddressValidationResult =
  | Readonly<{
      status: "valid";
      resolvedAddress: ContactAddress["address"];
      isDomain: boolean;
    }>
  | Readonly<{
      status: "invalid_format";
      isDomain?: boolean;
    }>
  | Readonly<{
      status: "domain_not_found" | "unavailable";
    }>;

export type ContactsAddressValidationPort = Readonly<{
  validateAddress(input: ContactsAddressValidationInput): Promise<ContactsAddressValidationResult>;
}>;

export type ContactsAddressValidationDependencies = Readonly<{
  findTokenById(currencyId: string): Promise<TokenCurrency | undefined>;
  supportsDomain(currency: CryptoCurrency | TokenCurrency): boolean;
  isEnsDomain(address: string): Promise<boolean>;
  validateDomain(address: string): boolean;
  resolveEnsDomain(address: string): Promise<string | null>;
  validateNetworkAddress(input: { network: CryptoCurrency; address: string }): Promise<boolean>;
}>;

export type ContactsAddressValidationGateway = Readonly<{
  findTokenById: ContactsAddressValidationDependencies["findTokenById"];
  supportsDomain: ContactsAddressValidationDependencies["supportsDomain"];
  getRegistriesForDomain(address: string): Promise<readonly { name: string }[]>;
  resolveDomain(address: string, registry: "ens"): Promise<readonly { address: string }[]>;
  validateDomain: ContactsAddressValidationDependencies["validateDomain"];
  getAccountBridgeByFamily(family: string): Promise<
    Readonly<{
      validateAddress(address: string, options: Readonly<{ currencyId: string }>): Promise<boolean>;
    }>
  >;
}>;
