import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { getSyncHash } from "../../logic";

initializeLegacyTokens(addTokens);

jest.mock("@ledgerhq/coin-framework/crypto-assets/index");

describe("getSyncHash", () => {
  const currency = getCryptoCurrencyById("ton");

  it("should provide a valid hex hash", () => {
    // mumurhash is always returning a 32bits uint, so a 4 bytes hexa string
    expect(getSyncHash(currency, [])).toStrictEqual(expect.stringMatching(/^0x[A-Fa-f0-9]{8}$/));
  });

  it("should provide a new hash if a token is added to the blacklistedTokenIds", async () => {
    (getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue({
        id: "ton/jetton/eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds",
        type: "TokenCurrency",
      }),
    });

    const token = await getCryptoAssetsStore().findTokenById(
      "ton/jetton/eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds",
    );
    expect(getSyncHash(currency, [])).not.toEqual(getSyncHash(currency, [token!.id]));
  });
});
