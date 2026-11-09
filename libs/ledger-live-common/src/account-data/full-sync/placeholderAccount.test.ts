import { AccountDataNotServedError } from "@domain/api-account-data";
import { AccountDescriptorSchema, toNetworkId } from "@domain/entity-account-descriptor";
import { placeholderAccount, toLegacyPath } from "./placeholderAccount";

const address = (network: string, value: string, path: string) =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: toNetworkId(network),
    address: value,
    path,
  });

describe("placeholderAccount", () => {
  it("is an empty account of the descriptor's currency, mode and index", () => {
    const account = placeholderAccount(
      address("ethereum", "0x0000000000000000000000000000000000000001", "m/44h/60h/1h/0/0"),
    );
    expect(account).toMatchObject({
      id: "js:2:ethereum:0x0000000000000000000000000000000000000001:",
      currency: expect.objectContaining({ id: "ethereum" }),
      index: 1,
      derivationMode: "",
      freshAddress: "0x0000000000000000000000000000000000000001",
      freshAddressPath: "44'/60'/1'/0/0",
      used: false,
      operations: [],
    });
    expect(account.balance.isZero()).toBe(true);
  });

  it("does not serve a family whose sync needs more than the descriptor", () => {
    expect(() =>
      placeholderAccount(
        address(
          "ton",
          "UQAqLu6YQwW4ZdF9SIg8AkJgtiFQ8UWYNeIGQ2MMmTj5fGk-",
          "m/44h/607h/0h/0h/0h/0h",
        ),
      ),
    ).toThrow(AccountDataNotServedError);
  });

  it("spells a descriptor path the legacy way", () => {
    expect(toLegacyPath("m/84h/0h/2h")).toBe("84'/0'/2'");
  });
});
