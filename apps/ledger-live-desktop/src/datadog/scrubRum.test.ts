import { scrubResourceUrl, scrubViewUrlHash, scrubActionTargetName } from "./scrubRum";

describe("scrubResourceUrl", () => {
  describe("address path segment", () => {
    it("redacts the address segment after /address/", () => {
      expect(scrubResourceUrl("https://api.ledger.com/blockchain/v4/eth/address/0xFoo/txs")).toBe(
        "https://api.ledger.com/blockchain/v4/eth/address/[redacted]/txs",
      );
    });

    it("is case-insensitive on the /address/ prefix", () => {
      expect(
        scrubResourceUrl("https://api.ledger.com/blockchain/v4/btc/Address/xpubFoo/utxo"),
      ).toBe("https://api.ledger.com/blockchain/v4/btc/Address/[redacted]/utxo");
    });

    it("redacts the address segment after /addresses/ (plural)", () => {
      expect(scrubResourceUrl("https://api.ledger.com/addresses/0xFoo/balance")).toBe(
        "https://api.ledger.com/addresses/[redacted]/balance",
      );
    });

    it("leaves URLs without /address/ unchanged", () => {
      const url = "https://api.ledger.com/blockchain/v4/eth/fees";
      expect(scrubResourceUrl(url)).toBe(url);
    });
  });

  describe("reverse-resolve path segment", () => {
    it("redacts the address segment after /reverse-resolve/", () => {
      expect(scrubResourceUrl("https://api.ledger.com/ens/reverse-resolve/0xFoo")).toBe(
        "https://api.ledger.com/ens/reverse-resolve/[redacted]",
      );
    });

    it("is case-insensitive on the /reverse-resolve/ prefix", () => {
      expect(scrubResourceUrl("https://api.ledger.com/ens/Reverse-Resolve/0xFoo")).toBe(
        "https://api.ledger.com/ens/Reverse-Resolve/[redacted]",
      );
    });
  });

  describe("query param account ID", () => {
    it("scrubs a URL-encoded account ID in a query param", () => {
      expect(
        scrubResourceUrl(
          "https://crypto-assets-service.api.ledger.com/v1/tokens?id=js%3A2%3Abitcoin%3AxpubFoo%3Asegwit",
        ),
      ).toBe(
        "https://crypto-assets-service.api.ledger.com/v1/tokens?id=js%3A2%3Abitcoin%3A%5Bredacted%5D%3Asegwit",
      );
    });

    it("leaves non-account-id query params unchanged", () => {
      const url = "https://api.ledger.com/v1/tokens?currency=bitcoin&limit=10";
      expect(scrubResourceUrl(url)).toBe(url);
    });
  });

  describe("edge cases", () => {
    it("returns an invalid URL as-is", () => {
      expect(scrubResourceUrl("not a url")).toBe("not a url");
    });

    it("handles a URL with both a path leak and a query param leak", () => {
      expect(
        scrubResourceUrl(
          "https://api.ledger.com/blockchain/v4/eth/address/0xFoo/txs?accountId=js%3A2%3Aethereum%3A0xFoo%3A",
        ),
      ).toBe(
        "https://api.ledger.com/blockchain/v4/eth/address/[redacted]/txs?accountId=js%3A2%3Aethereum%3A%5Bredacted%5D%3A",
      );
    });
  });
});

describe("scrubViewUrlHash", () => {
  it("scrubs the account ID from a hash-router account route", () => {
    expect(scrubViewUrlHash("/account/js:2:bitcoin:xpubFoo:segwit")).toBe(
      "/account/js:2:bitcoin:[redacted]:segwit",
    );
  });

  it("leaves a hash without an account ID unchanged", () => {
    expect(scrubViewUrlHash("/cryptos")).toBe("/cryptos");
  });

  it("leaves the portfolio route unchanged", () => {
    expect(scrubViewUrlHash("/")).toBe("/");
  });
});

describe("scrubActionTargetName", () => {
  it('redacts an EVM address in a "xpub" JSON key-value', () => {
    expect(scrubActionTargetName('click on { "xpub": "0xFoo", "index": 0 }')).toBe(
      'click on { "xpub": "[redacted]", "index": 0 }',
    );
  });

  it('redacts a Bitcoin xpub in a "xpub" JSON key-value', () => {
    expect(scrubActionTargetName('click on { "xpub": "xpubFoo", "index": 0 }')).toBe(
      'click on { "xpub": "[redacted]", "index": 0 }',
    );
  });

  it("handles whitespace variations around the colon", () => {
    expect(scrubActionTargetName('"xpub" : "xpubFoo"')).toBe('"xpub": "[redacted]"');
  });

  it("leaves action names without a xpub field unchanged", () => {
    expect(scrubActionTargetName("click on portfolio tab")).toBe("click on portfolio tab");
  });
});
