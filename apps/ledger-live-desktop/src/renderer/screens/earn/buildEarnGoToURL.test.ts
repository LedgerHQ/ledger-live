import {
  NATIVE_STAKE_POSITION_INPUT_KEY,
  NATIVE_STAKE_POSITION_INPUT_VALUE,
} from "@features/flow-stake-position";
import { buildEarnGoToURL } from "./buildEarnGoToURL";

describe("buildEarnGoToURL", () => {
  it("appends Earn initialization params to the partner dapp URL", () => {
    const result = buildEarnGoToURL("https://earn.example/?yieldId=tron&accountId=abc", {
      theme: "dark",
      lang: "en",
      uiVersion: "v2",
      lw40enabled: "true",
    });

    const url = new URL(result);
    expect(url.searchParams.get("yieldId")).toBe("tron");
    expect(url.searchParams.get("accountId")).toBe("abc");
    expect(url.searchParams.get("theme")).toBe("dark");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("uiVersion")).toBe("v2");
    expect(url.searchParams.get("lw40enabled")).toBe("true");
  });

  it("drops a stake position capability that the partner dapp URL already carries", () => {
    const result = buildEarnGoToURL(
      `https://earn.example/?yieldId=tron&${NATIVE_STAKE_POSITION_INPUT_KEY}=true`,
      { theme: "dark" },
    );

    const url = new URL(result);
    expect(url.searchParams.has(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(false);
    expect(url.searchParams.get("yieldId")).toBe("tron");
    expect(url.searchParams.get("theme")).toBe("dark");
  });

  it("lets the host params grant the capability over a value in the partner dapp URL", () => {
    const result = buildEarnGoToURL(
      `https://earn.example/?${NATIVE_STAKE_POSITION_INPUT_KEY}=false`,
      { [NATIVE_STAKE_POSITION_INPUT_KEY]: NATIVE_STAKE_POSITION_INPUT_VALUE },
    );

    expect(new URL(result).searchParams.get(NATIVE_STAKE_POSITION_INPUT_KEY)).toBe(
      NATIVE_STAKE_POSITION_INPUT_VALUE,
    );
  });

  it("returns the original URL when parsing fails", () => {
    expect(buildEarnGoToURL("not-a-valid-url", { theme: "dark" })).toBe("not-a-valid-url");
  });
});
