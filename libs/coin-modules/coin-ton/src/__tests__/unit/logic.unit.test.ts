import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { getSyncHash } from "../../logic";

describe("getSyncHash", () => {
  const currency = getCryptoCurrencyById("ton");

  it("should provide a valid hex hash", () => {
    // mumurhash is always returning a 32bits uint, so a 4 bytes hexa string
    expect(getSyncHash(currency, [])).toStrictEqual(expect.stringMatching(/^0x[A-Fa-f0-9]{8}$/));
  });

  it("should provide a new hash if a token is added to the blacklistedTokenIds", () => {
    const token = getTokenById("ton/jetton/eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds");
    expect(getSyncHash(currency, [])).not.toEqual(getSyncHash(currency, [token.id]));
  });
});
