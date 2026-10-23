import { redactUrl } from "./redactUrl";

describe("redactUrl", () => {
  it("keeps only the origin of a web URL", () => {
    expect(redactUrl("https://explorer.test/address/bc1qaddress?tab=txs#top")).toBe(
      "https://explorer.test",
    );
  });

  it("keeps only the protocol of a URL without origin", () => {
    expect(redactUrl("mailto:someone@ledger.com")).toBe("mailto:");
  });
});
