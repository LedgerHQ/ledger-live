import { generateMnemonic, accountFromMnemonic } from "iso-filecoin/wallet";
import { TEST_ADDRESSES } from "../../test/fixtures";
import { listOperations } from "./listOperations";

// F1_ADDRESS has a single known IN transaction at block 145170.
const KNOWN_TX_MIN_HEIGHT = 145_000;

describe("listOperations (integration)", () => {
  it("returns empty array for a pristine account", async () => {
    const mnemonic = generateMnemonic();
    const pristine = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");

    const result = await listOperations(pristine.address.toString(), {
      minHeight: 0,
      limit: 5,
    });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  // FIXME: Filecoin API `/v2/addresses/{addr}/transactions` times out for addresses with history.
  // See: LIVE-18673
  it.skip("fetches operations with correct metadata for a standard account", async () => {
    const result = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: KNOWN_TX_MIN_HEIGHT,
      limit: 5,
    });

    expect(result.items.length).toBeGreaterThan(0);

    const op = result.items[0];
    expect(typeof op.id).toBe("string");
    expect(["IN", "OUT", "FEES"]).toContain(op.type);
    expect(typeof op.value).toBe("bigint");
    expect(Array.isArray(op.senders)).toBe(true);
    expect(Array.isArray(op.recipients)).toBe(true);
    expect(typeof op.asset.type).toBe("string");
    expect(typeof op.tx.hash).toBe("string");
    expect(typeof op.tx.block.height).toBe("number");
    expect(op.tx.date).toBeInstanceOf(Date);
    expect(typeof op.tx.fees).toBe("bigint");
    expect(typeof op.tx.failed).toBe("boolean");
  });
});
