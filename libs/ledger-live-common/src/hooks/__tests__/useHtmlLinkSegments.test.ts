import {
  buildHtmlDisplaySegments,
  splitHtmlLinkSegments,
  validateLedgerUrl,
} from "../useHtmlLinkSegments";

describe("splitHtmlLinkSegments", () => {
  it("returns an empty array when input is empty", () => {
    expect(splitHtmlLinkSegments("")).toEqual([]);
  });

  it("returns only text segments when there are no anchors", () => {
    const segments = splitHtmlLinkSegments("simple text without links");
    expect(segments).toEqual([{ type: "text", content: "simple text without links" }]);
  });

  it("splits text into text and link segments", () => {
    const segments = splitHtmlLinkSegments('Hello <a href="https://ledger.com">Ledger</a> !');

    expect(segments).toEqual([
      { type: "text", content: "Hello " },
      { type: "link", label: "Ledger", href: "https://ledger.com" },
      { type: "text", content: " !" },
    ]);
  });

  it("keeps whitespace-only text segments", () => {
    const segments = splitHtmlLinkSegments(
      '<a href="https://ledger.com">Ledger</a> <a href="https://support.ledger.com">Support</a>',
    );

    expect(segments).toEqual([
      { type: "link", label: "Ledger", href: "https://ledger.com" },
      { type: "text", content: " " },
      { type: "link", label: "Support", href: "https://support.ledger.com" },
    ]);
  });
});

describe("buildHtmlDisplaySegments", () => {
  it("keeps valid ledger links clickable", () => {
    const segments = buildHtmlDisplaySegments(
      'Visit <a href="https://support.ledger.com">support</a> docs',
    );

    expect(segments).toEqual([
      { type: "text", content: "Visit " },
      { type: "link", href: "https://support.ledger.com", label: "support" },
      { type: "text", content: " docs" },
    ]);
  });

  it("falls back to text segments for non-ledger links", () => {
    const segments = buildHtmlDisplaySegments('Check <a href="https://example.com">here</a>');

    expect(segments).toEqual([
      { type: "text", content: "Check " },
      { type: "text", content: "here" },
    ]);
  });

  it("ignores invalid protocols", () => {
    const segments = buildHtmlDisplaySegments('Bad <a href="javascript:alert(1)">click</a>');

    expect(segments).toEqual([
      { type: "text", content: "Bad " },
      { type: "text", content: "click" },
    ]);
  });
});

describe("validateLedgerUrl", () => {
  it("accepts ledger http(s) URLs", () => {
    expect(validateLedgerUrl("https://ledger.com")).toEqual({
      isHttp: true,
      isAllowedLedgerDomain: true,
    });

    expect(validateLedgerUrl("https://support.ledger.com/hc/en-us")).toEqual({
      isHttp: true,
      isAllowedLedgerDomain: true,
    });
  });

  it("rejects non-http protocols", () => {
    expect(validateLedgerUrl("ledgerlive://settings")).toEqual({
      isHttp: false,
      isAllowedLedgerDomain: false,
    });
  });

  it("rejects non-ledger domains", () => {
    expect(validateLedgerUrl("https://example.com")).toEqual({
      isHttp: true,
      isAllowedLedgerDomain: false,
    });
  });

  it("rejects invalid URLs", () => {
    expect(validateLedgerUrl("not a url")).toEqual({
      isHttp: false,
      isAllowedLedgerDomain: false,
    });
  });
});
