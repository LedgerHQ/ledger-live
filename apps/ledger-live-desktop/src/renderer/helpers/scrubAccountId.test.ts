import { redactAccountId, scrubAccountId } from "./scrubAccountId";

const ACCOUNT_IDS: [label: string, raw: string, scrubbed: string][] = [
  [
    "Bitcoin (xpub)",
    "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy:segwit",
    "js:2:bitcoin:[redacted]:segwit",
  ],
  [
    "Litecoin (Ltub)",
    "js:2:litecoin:Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF:segwit",
    "js:2:litecoin:[redacted]:segwit",
  ],
  [
    "Bitcoin Cash (xpub, route path)",
    "/account/js:2:bitcoin_cash:xpub6CeKzz7faNYpxQPyLyEZ2BoP2Teej1Ruaie3UV9xhgVjjbTGKZECx6QWba6TY6QRpweEe4p7YuDzvCmRHjwhXPNqHL......:",
    "/account/js:2:bitcoin_cash:[redacted]:",
  ],
  [
    "Cardano (hex pubkey+chaincode)",
    "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano",
    "js:2:cardano_testnet:[redacted]:cardano",
  ],
  [
    "Ethereum (0x address)",
    "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:",
    "js:2:ethereum:[redacted]:",
  ],
  [
    "Cosmos (bech32)",
    "js:2:cosmos:cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq:",
    "js:2:cosmos:[redacted]:",
  ],
  [
    "Solana (base58 pubkey)",
    "js:2:solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:solana",
    "js:2:solana:[redacted]:solana",
  ],
  ["Tron (T-prefixed)", "js:2:tron:TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH:", "js:2:tron:[redacted]:"],
  [
    "Polkadot (SS58)",
    "js:2:polkadot:12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS:",
    "js:2:polkadot:[redacted]:",
  ],
  [
    "Hedera (~!colons!~ encoded)",
    "js:2:hedera:302a300506032b6570032100abcdef~!colons!~302a:",
    "js:2:hedera:[redacted]:",
  ],
  [
    "Aleo (customData = view key)",
    "js:2:aleo:aleoAddr1abcdef:aleoMode:viewKey1234secret",
    "js:2:aleo:[redacted]:aleoMode:[redacted]",
  ],
  [
    "digit-prefixed currencyId (e.g. 0xkvn)",
    "js:2:0xkvn:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:",
    "js:2:0xkvn:[redacted]:",
  ],
  [
    "mock account (type=mock, UUID address)",
    "/account/mock:1:aleo:f0a085cc-3d87-44f8-980d-5d53defe1a7f:",
    "/account/mock:1:aleo:[redacted]:",
  ],
];

const TOKEN_IDS: [label: string, raw: string, scrubbed: string][] = [
  [
    "EVM ERC-20",
    "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:+ethereum%2Ferc20%2Fusd~!underscore!~coin",
    "js:2:ethereum:[redacted]:+ethereum%2Ferc20%2Fusd~!underscore!~coin",
  ],
  [
    "Cardano native asset",
    "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
    "js:2:cardano_testnet:[redacted]:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
  ],
];

describe("scrubAccountId", () => {
  it.each(ACCOUNT_IDS)("scrubs %s", (_label, raw, scrubbed) => {
    expect(scrubAccountId(`syncing ${raw} failed`)).toBe(`syncing ${scrubbed} failed`);
  });

  it.each(TOKEN_IDS)(
    "scrubs token account %s — preserves +tokenId suffix",
    (_label, raw, scrubbed) => {
      expect(scrubAccountId(`syncing ${raw} failed`)).toBe(`syncing ${scrubbed} failed`);
    },
  );

  it("does not touch strings without an account id", () => {
    const msg = "currency: bitcoin, amount: 0.001";
    expect(scrubAccountId(msg)).toBe(msg);
  });
});

describe("redactAccountId", () => {
  it("redacts address field", () => {
    expect(
      redactAccountId(
        "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy:segwit",
      ),
    ).toBe("js:2:bitcoin:[redacted]:segwit");
  });

  it("redacts address and customData", () => {
    expect(redactAccountId("js:2:aleo:aleoAddr1abcdef:aleoMode:viewKey1234secret")).toBe(
      "js:2:aleo:[redacted]:aleoMode:[redacted]",
    );
  });

  it("redacts address and preserves +tokenId", () => {
    expect(
      redactAccountId(
        "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
      ),
    ).toBe(
      "js:2:cardano_testnet:[redacted]:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
    );
  });

  it("returns the input unchanged when there are fewer than 5 fields", () => {
    const id = "js:2:bitcoin";
    expect(redactAccountId(id)).toBe(id);
  });

  it("uses the last + as token separator so a + inside customData is fully redacted", () => {
    expect(redactAccountId("js:2:coin:addr:mode:data+sensitive+tokenId")).toBe(
      "js:2:coin:[redacted]:mode:[redacted]+tokenId",
    );
  });
});
