import { validateAddress } from "../validateAddress";
import { FUNDED_P2PKH, FUNDED_P2WPKH, PRISTINE_P2TR } from "./helpers/fixtures";

describe("validateAddress", () => {
  it("throws when the currency parameter is absent", async () => {
    await expect(validateAddress("some random address", {})).rejects.toThrow(
      "Missing currency parameter for address validation on Bitcoin",
    );
  });

  it.each([FUNDED_P2PKH, FUNDED_P2WPKH, PRISTINE_P2TR])(
    "accepts the bitcoin address %s",
    async address => {
      await expect(validateAddress(address, { currencyId: "bitcoin" })).resolves.toBe(true);
    },
  );

  it.each([
    ["an address of another network", "ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx", "bitcoin"],
    ["a mistyped address", FUNDED_P2WPKH.slice(0, -1) + "x", "bitcoin"],
    ["garbage", "some random address", "bitcoin"],
  ])("refuses %s", async (_label, address, currencyId) => {
    await expect(validateAddress(address, { currencyId })).resolves.toBe(false);
  });

  it("accepts an address for its own network", async () => {
    await expect(
      validateAddress("ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx", { currencyId: "litecoin" }),
    ).resolves.toBe(true);
  });

  it("refuses any address for a currency wallet-btc does not describe", async () => {
    await expect(validateAddress(FUNDED_P2WPKH, { currencyId: "not_a_currency" })).resolves.toBe(
      false,
    );
  });
});
