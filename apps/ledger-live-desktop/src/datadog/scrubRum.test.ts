import { scrubActionTargetName, scrubAutoActionName, scrubViewUrl } from "./scrubRum";

const PAGE = "https://app.asar/.webpack/index.html";

describe("scrubViewUrl", () => {
  it("removes the query string of the page", () => {
    expect(scrubViewUrl(`${PAGE}?theme=dark&appDirname=%2Fopt%2Fexample#/cryptos`)).toBe(
      `${PAGE}#/cryptos`,
    );
  });

  it("redacts the account ID of an account route", () => {
    expect(scrubViewUrl(`${PAGE}#/account/js:2:bitcoin:xpubExample1:segwit/history`)).toBe(
      `${PAGE}#/account/[redacted]/history`,
    );
  });

  it("redacts the account aliases of an account route", () => {
    expect(
      scrubViewUrl(
        `${PAGE}#/account/00000000-0000-5000-8000-000000000001/00000000-0000-5000-8000-000000000002`,
      ),
    ).toBe(`${PAGE}#/account/[redacted]/[redacted]`);
  });

  it("keeps the currency of an asset route", () => {
    expect(scrubViewUrl(`${PAGE}#/asset/bitcoin`)).toBe(`${PAGE}#/asset/bitcoin`);
  });

  it("removes the query string of the route", () => {
    expect(scrubViewUrl(`${PAGE}#/swap?from=example`)).toBe(`${PAGE}#/swap`);
  });

  it("leaves the portfolio route unchanged", () => {
    expect(scrubViewUrl(`${PAGE}#/`)).toBe(`${PAGE}#/`);
  });

  it("removes the query string of a url without a route", () => {
    expect(scrubViewUrl(`${PAGE}?theme=dark`)).toBe(PAGE);
  });

  it("leaves an empty referrer empty", () => {
    expect(scrubViewUrl("")).toBe("");
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

describe("scrubAutoActionName", () => {
  it("redacts the words holding a digit", () => {
    expect(scrubAutoActionName("Bitcoin 2 Legacy")).toBe("Bitcoin [redacted] Legacy");
  });

  it("redacts an amount", () => {
    expect(scrubAutoActionName("Total $1,234.56")).toBe("Total [redacted]");
  });

  it("redacts a shortened value", () => {
    expect(scrubAutoActionName("Savings abcd...wxyz")).toBe("Savings [redacted]");
    expect(scrubAutoActionName("Savings abcd…wxyz")).toBe("Savings [redacted]");
  });

  it("merges adjacent redactions", () => {
    expect(scrubAutoActionName("Bitcoin 2 Legacy 1abCd...wXyZ9 $1,234.56")).toBe(
      "Bitcoin [redacted] Legacy [redacted]",
    );
  });

  it("keeps a trailing ellipsis", () => {
    expect(scrubAutoActionName("Loading...")).toBe("Loading...");
  });

  it("keeps a name made of plain words", () => {
    expect(scrubAutoActionName("Add account")).toBe("Add account");
  });

  it('redacts a "xpub" JSON key-value', () => {
    expect(scrubAutoActionName('{ "xpub": "xpubFoo" }')).toBe('{ "xpub": "[redacted]" }');
  });
});
