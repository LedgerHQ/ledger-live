import { getPredictionsWebviewInputs } from "../webviewInputs";

const HOST_INPUTS = { theme: "dark", platform: "LLD", lang: "en" };

describe("getPredictionsWebviewInputs", () => {
  it("passes the link params with the host context", () => {
    expect(getPredictionsWebviewInputs({ eventSlug: "btc-100k" }, HOST_INPUTS)).toEqual({
      eventSlug: "btc-100k",
      ...HOST_INPUTS,
    });
  });

  it("doesn't let a link param override the host context", () => {
    expect(getPredictionsWebviewInputs({ platform: "LLM" }, HOST_INPUTS).platform).toBe("LLD");
  });

  it("adds the host context and the link params to a goToURL", () => {
    const inputs = getPredictionsWebviewInputs(
      {
        goToURL: "https://predictions.live.ledger.com/category/sports?platform=LLM",
        ajs_prop_source: "crm",
      },
      HOST_INPUTS,
    );

    const goToURL = new URL(inputs.goToURL ?? "");
    expect(goToURL.pathname).toBe("/category/sports");
    expect(Object.fromEntries(goToURL.searchParams)).toEqual({
      ajs_prop_source: "crm",
      ...HOST_INPUTS,
    });
  });

  it("drops a goToURL that isn't a URL", () => {
    expect(getPredictionsWebviewInputs({ goToURL: "not a url" }, HOST_INPUTS)).toEqual(HOST_INPUTS);
  });
});
