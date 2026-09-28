import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import { contactsAddressSupportsDomain } from "./contactsAddressSupportsDomain";

describe("contactsAddressSupportsDomain", () => {
  it.each([
    ["an EVM network", "ethereum", true],
    ["an EVM token", "ethereum/erc20/usd__coin", true],
    ["a non-EVM network", "bitcoin", false],
    ["a non-EVM token", "solana/spl/usdc", false],
    ["an unknown currency", "unknown-currency", false],
    ["a missing currency", undefined, false],
  ])("should resolve domain support for %s", (_, currencyId, expected) => {
    const parsedCurrencyId =
      currencyId === undefined ? undefined : ContactCurrencyIdSchema.parse(currencyId);

    expect(contactsAddressSupportsDomain(parsedCurrencyId)).toBe(expected);
  });
});
