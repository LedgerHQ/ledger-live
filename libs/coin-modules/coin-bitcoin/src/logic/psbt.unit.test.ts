jest.mock("@ledgerhq/psbtv2", () => {
  const actual = jest.requireActual("@ledgerhq/psbtv2");
  return { ...actual, extractHashFromScriptPubKey: jest.fn(actual.extractHashFromScriptPubKey) };
});
import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import { buildKnownAddressDerivations } from "./psbt";
import { cryptoFor } from "./currency";

const XPUB =
  "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC";
const crypto = cryptoFor("bitcoin");

describe("buildKnownAddressDerivations", () => {
  it("maps each address' script hash to its key and path", async () => {
    const address = await crypto.getAddress("Native SegWit", XPUB, 0, 1);
    const map = await buildKnownAddressDerivations("bitcoin", XPUB, "84'/0'/0'", [
      { address, chain: 0, index: 1 },
    ]);
    expect(map.size).toBe(1);
    const [entry] = [...map.values()];
    expect(entry.path).toEqual([0x80000054, 0x80000000, 0x80000000, 0, 1]);
    expect(entry.pubkey.equals(await crypto.getPubkeyAt(XPUB, 0, 1))).toBe(true);
  });

  it("skips a script with no recognizable hash", async () => {
    (extractHashFromScriptPubKey as jest.Mock).mockReturnValueOnce(undefined);
    const address = await crypto.getAddress("Native SegWit", XPUB, 0, 2);
    const map = await buildKnownAddressDerivations("bitcoin", XPUB, "84'/0'/0'", [
      { address, chain: 0, index: 2 },
    ]);
    expect(map.size).toBe(0);
  });
});
