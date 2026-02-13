import {
  decodeAccountId,
  decodeTokenAccountId,
  encodeAccountId,
  encodeTokenAccountId,
  safeDecodeTokenId,
  safeDecodeXpubOrAddress,
  safeEncodeTokenId,
  safeEncodeXpubOrAddress,
} from "./accountId";
import tokenData from "./__fixtures__/binance-peg_dai_token.json";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as cryptoAssets from "@ledgerhq/cryptoassets/state";
import type { AccountIdParams, CryptoAssetsStore } from "@ledgerhq/types-live";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const TOKEN = tokenData as TokenCurrency;

describe("coin-framework", () => {
  describe("accountId", () => {
    describe("safeEncodeTokenId", () => {
      it("shouldn't throw with falsy tokenId", () => {
        expect(safeEncodeTokenId(null as any)).toBe("");
        expect(safeEncodeTokenId(undefined as any)).toBe("");
        expect(safeEncodeTokenId("")).toBe("");
      });

      it("should encode a token id by making it URI encoded and remove characters used for accountId splitting", () => {
        const tokenId = "foo/bar-baz_qux+fred thud0123°?=/&$";

        expect(safeEncodeTokenId(tokenId)).not.toMatch(
          // should match with any character exect those
          new RegExp("[^a-z0-9.!~*'()%]", "gi"),
        );
      });
    });
    describe("safeDecodeTokenId", () => {
      it("shouldn't throw with falsy encodedTokenId", () => {
        expect(safeDecodeTokenId(null as any)).toBe("");
        expect(safeDecodeTokenId(undefined as any)).toBe("");
        expect(safeDecodeTokenId("")).toBe("");
      });

      it("should decode a token id and remove all obfuscation", () => {
        const encodedTokenId =
          "foo%2Fbar~!dash!~baz~!underscore!~qux%2Bfred%20thud0123456789%C2%B0";

        expect(safeDecodeTokenId(encodedTokenId)).toBe("foo/bar-baz_qux+fred thud0123456789°");
      });
    });

    describe("encodeTokenAccountId", () => {
      it("should return an URI and splitting safe tokenAccountId (no + - _ % \\ /)", () => {
        const accountId = "js:2:0xkvn:";

        const tokenAccountId = encodeTokenAccountId(accountId, TOKEN);
        expect(tokenAccountId).toBe(
          "js:2:0xkvn:+bsc%2Fbep20%2Fbinance~!dash!~peg~!underscore!~dai~!underscore!~token",
        );
        expect(tokenAccountId).not.toMatch(
          // should match with any character exect those
          new RegExp("[^a-z0-9.!~*'()%:+]", "gi"),
        );
        // Should only contain 1 + character
        expect(tokenAccountId.split("+").length).toBe(2);
      });
    });

    describe("decodeTokenAccountId", () => {
      it("should return an accountId and a token", async () => {
        jest
          .spyOn(cryptoAssets, "getCryptoAssetsStore")
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          .mockReturnValue({
            findTokenById: (_: unknown) => Promise.resolve(TOKEN),
            findTokenByAddressInCurrency: (_: unknown, __: unknown) => Promise.resolve(TOKEN),
          } as CryptoAssetsStore);

        expect(
          await decodeTokenAccountId(
            "js:2:0xkvn:+bsc%2Fbep20%2Fbinance~!dash!~peg~!underscore!~dai~!underscore!~token",
          ),
        ).toEqual({
          accountId: "js:2:0xkvn:",
          token: TOKEN,
        });
      });
    });

    describe("safeEncodeXpubOrAddress", () => {
      it("shouldn't throw with falsy xpubOrAddress", () => {
        expect(safeEncodeXpubOrAddress(null as any)).toBe("");
        expect(safeEncodeXpubOrAddress(undefined as any)).toBe("");
        expect(safeEncodeXpubOrAddress("")).toBe("");
      });

      it("should encode double colons in xpubOrAddress", () => {
        const xpubOrAddress =
          "ldg::1220c81315e2bf2524a9141bcc6cbf19b61c151e0dcaa95343c0ccf53aed7415c4ec";
        const expected =
          "ldg~!colons!~1220c81315e2bf2524a9141bcc6cbf19b61c151e0dcaa95343c0ccf53aed7415c4ec";

        expect(safeEncodeXpubOrAddress(xpubOrAddress)).toBe(expected);
      });
    });

    describe("safeDecodeXpubOrAddress", () => {
      it("shouldn't throw with falsy encodedXpubOrAddress", () => {
        expect(safeDecodeXpubOrAddress(null as any)).toBe("");
        expect(safeDecodeXpubOrAddress(undefined as any)).toBe("");
        expect(safeDecodeXpubOrAddress("")).toBe("");
      });

      it("should decode double colons from encoded xpubOrAddress", () => {
        const encodedXpubOrAddress =
          "ldg~!colons!~1220c81315e2bf2524a9141bcc6cbf19b61c151e0dcaa95343c0ccf53aed7415c4ec";
        const expected =
          "ldg::1220c81315e2bf2524a9141bcc6cbf19b61c151e0dcaa95343c0ccf53aed7415c4ec";

        expect(safeDecodeXpubOrAddress(encodedXpubOrAddress)).toBe(expected);
      });
    });

    describe("encodeAccountId", () => {
      it("should encode with and without customData", () => {
        const base = {
          type: "js",
          version: "2",
          currencyId: "bitcoin",
          xpubOrAddress: "xpub123",
          derivationMode: "",
        } as AccountIdParams;

        expect(encodeAccountId(base)).toBe("js:2:bitcoin:xpub123:");
        expect(encodeAccountId({ ...base, customData: "viewkey" })).toBe(
          "js:2:bitcoin:xpub123::viewkey",
        );
        expect(encodeAccountId({ ...base, customData: "" })).toBe("js:2:bitcoin:xpub123:");
      });

      it("should safely encode double colons in customData", () => {
        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "aleo",
          xpubOrAddress: "aleo1xyz",
          derivationMode: "",
          customData: "view::key::123",
        });

        expect(accountId).toBe("js:2:aleo:aleo1xyz::view~!colons!~key~!colons!~123");
      });
    });

    describe("decodeAccountId", () => {
      it("should decode with and without customData", () => {
        expect(decodeAccountId("js:2:bitcoin:xpub123:").customData).toBeUndefined();
        expect(decodeAccountId("js:2:bitcoin:xpub123::viewkey").customData).toBe("viewkey");
        expect(decodeAccountId("js:2:aleo:aleo1xyz::view~!colons!~key").customData).toBe(
          "view::key",
        );
      });
    });
  });
});
