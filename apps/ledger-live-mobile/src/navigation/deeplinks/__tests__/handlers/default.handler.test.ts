import { getStateFromPath } from "@react-navigation/native";
import { defaultHandler } from "../../handlers/default";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

function makeParsed(rawPath: string): ParsedDeeplink {
  const url = new URL(`ledgerwallet://${rawPath}`);
  return {
    hostname: url.hostname,
    pathname: url.pathname,
    platform: url.pathname.split("/")[1] ?? "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath,
    url,
  };
}

describe("defaultHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
  });

  it("passes rawPath directly to getStateFromPath", () => {
    const context = makeContext();
    defaultHandler(makeParsed("portfolio"), context);

    expect(mockedGetStateFromPath).toHaveBeenCalledWith("portfolio", context.config);
  });

  it("returns the result of getStateFromPath", () => {
    const context = makeContext();
    const result = defaultHandler(makeParsed("settings/general"), context);

    expect(result).toEqual({ routes: [{ name: "nav:settings/general" }] });
  });

  it("passes the config through unchanged", () => {
    const config = { screens: {} };
    const context = makeContext({ config });
    defaultHandler(makeParsed("earn"), context);

    expect(mockedGetStateFromPath).toHaveBeenCalledWith("earn", config);
  });
});
