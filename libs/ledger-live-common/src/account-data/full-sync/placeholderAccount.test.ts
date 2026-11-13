import { AccountDataNotServedError } from "@domain/api-account-data";
import { AccountDescriptorSchema, toNetworkId } from "@domain/entity-account-descriptor";
import { placeholderAccount, toLegacyPath } from "./placeholderAccount";

const mockUsesMockBridges = jest.fn(() => false);
jest.mock("../../bridge/mockMode", () => ({ usesMockBridges: () => mockUsesMockBridges() }));

const address = (network: string, value: string, path: string) =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: toNetworkId(network),
    key: value,
    path,
  });

const ZCASH_XPUB =
  "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
const EXTENDED_KEY = `${"35".repeat(32)}${"47".repeat(32)}`;

describe("placeholderAccount", () => {
  it("is an empty account of the descriptor's currency, mode and index", async () => {
    const account = await placeholderAccount(
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

  it("keys a public-key family on its public key, at the address computed from it", async () => {
    const publicKey = "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060";
    const account = await placeholderAccount(address("ton", publicKey, "m/44h/607h/0h/0h/0h/0h"));
    expect(account).toMatchObject({
      id: `js:2:ton:${publicKey}:ton`,
      freshAddress: "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4",
    });
  });

  // The legacy ids, as each family's scan encodes them: zcash sync.ts `performTransparentSync`,
  // kaspa synchronization.ts `getAccountShape`, cardano synchronisation.ts `makeGetAccountShape`.
  it.each([
    ["zcash", ZCASH_XPUB, "m/44h/133h/1h", `js:2:zcash:${ZCASH_XPUB}:`, 1],
    ["kaspa", EXTENDED_KEY, "m/44h/111111h/2h", `js:2:kaspa:${EXTENDED_KEY}:`, 2],
    ["cardano", EXTENDED_KEY, "m/1852h/1815h/3h", `js:2:cardano:${EXTENDED_KEY}:cardano`, 3],
  ])(
    "keys a %s account on its xpub, with the legacy account id",
    async (currencyId, key, path, id, index) => {
      const account = await placeholderAccount(
        AccountDescriptorSchema.parse({
          purpose: "account",
          version: "2",
          type: "utxo",
          network: toNetworkId(currencyId),
          key,
          path,
        }),
      );
      expect(account).toMatchObject({ id, xpub: key, index });
    },
  );

  it("is a mock account while mock bridges serve currencies", async () => {
    mockUsesMockBridges.mockReturnValueOnce(true);
    const account = await placeholderAccount(
      address("ethereum", "0x0000000000000000000000000000000000000001", "m/44h/60h/0h/0/0"),
    );
    expect(account.id).toBe("mock:2:ethereum:0x0000000000000000000000000000000000000001:");
  });

  it("does not serve a family whose sync needs more than the descriptor", async () => {
    await expect(
      placeholderAccount(address("canton_network", "ab".repeat(32), "m/44h/6767h/0h/0h/0h")),
    ).rejects.toThrow(AccountDataNotServedError);
  });

  it("is a Hedera account at the account id of its descriptor, with the legacy id", async () => {
    const account = await placeholderAccount(address("hedera", "0.0.751515", "m/44/3030"));
    expect(account).toMatchObject({
      id: "js:2:hedera:0.0.751515:hederaBip44",
      freshAddress: "0.0.751515",
      freshAddressPath: "44/3030",
    });
  });

  it("spells a descriptor path the legacy way", () => {
    expect(toLegacyPath("m/84h/0h/2h")).toBe("84'/0'/2'");
  });
});
