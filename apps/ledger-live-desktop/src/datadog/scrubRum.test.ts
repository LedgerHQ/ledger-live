import { scrubViewUrlHash, scrubActionTargetName } from "./scrubRum";

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
