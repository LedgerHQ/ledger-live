import { hexToBytes } from "@noble/hashes/utils";
import { bech32 } from "./bech32";

describe("bech32", () => {
  it("encodes the BIP-173 vector with no data", () => {
    expect(bech32("a", new Uint8Array())).toBe("a12uel5l");
  });

  it("encodes a Cardano account key past the 90 character limit", () => {
    expect(
      bech32(
        "acct_xvk",
        hexToBytes(
          "8e8131277ac46bf6b526fff4fe00cecc71026c278340c44458878bd162f70367505e1ea016e67052b3697ac749e4b034010056e7fd8e8486682665cd9693fb21",
        ),
      ),
    ).toBe(
      "acct_xvk136qnzfm6c34lddfxll60uqxwe3csymp8sdqvg3zcs79azchhqdn4qhs75qtwvuzjkd5h436fujcrgqgq2mnlmr5yse5zvewdj6flkgg5catgs",
    );
  });
});
