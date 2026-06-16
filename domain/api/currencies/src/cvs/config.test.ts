import { getCvsBaseUrl, setCvsBaseUrl } from "./config";

describe("cvs base url config", () => {
  it("defaults to the production Countervalues Service URL", () => {
    expect(getCvsBaseUrl()).toBe("https://countervalues.live.ledger.com");
  });

  it("can be overridden", () => {
    setCvsBaseUrl("https://staging.example.com");
    expect(getCvsBaseUrl()).toBe("https://staging.example.com");
    setCvsBaseUrl("https://countervalues.live.ledger.com");
  });
});
