import { modularDrawerHandler } from "../../handlers/modularDrawer";
import { handleModularDrawerDeeplink } from "LLM/features/ModularDrawer";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("LLM/features/ModularDrawer", () => ({
  handleModularDrawerDeeplink: jest.fn((hostname: string) => ({
    routes: [{ name: `modular:${hostname}` }],
  })),
}));

function makeParsed(hostname: "receive" | "add-account"): ParsedDeeplink {
  const url = new URL(`ledgerwallet://${hostname}`);
  return {
    hostname,
    pathname: "",
    platform: "",
    searchParams: url.searchParams,
    query: {},
    rawPath: hostname,
    url,
  };
}

describe("modularDrawerHandler", () => {
  const mockedDelegate = jest.mocked(handleModularDrawerDeeplink);

  beforeEach(() => {
    mockedDelegate.mockClear();
  });

  it("delegates 'receive' to handleModularDrawerDeeplink", () => {
    const context = makeContext();
    modularDrawerHandler(makeParsed("receive"), context);

    expect(mockedDelegate).toHaveBeenCalledWith(
      "receive",
      expect.any(URLSearchParams),
      context.dispatch,
      context.config,
    );
  });

  it("delegates 'add-account' to handleModularDrawerDeeplink", () => {
    const context = makeContext();
    modularDrawerHandler(makeParsed("add-account"), context);

    expect(mockedDelegate).toHaveBeenCalledWith(
      "add-account",
      expect.any(URLSearchParams),
      context.dispatch,
      context.config,
    );
  });

  it("returns the result from handleModularDrawerDeeplink", () => {
    const result = modularDrawerHandler(makeParsed("receive"), makeContext());

    expect(result).toEqual({ routes: [{ name: "modular:receive" }] });
  });
});
