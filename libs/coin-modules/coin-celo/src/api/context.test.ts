import { setCoinConfig } from "../config";
import { createMockCeloContext, mockCeloConfig } from "../test/context";
import { createApi } from ".";

const httpMock = jest.fn((url: string) => ({ url }));
const sendRawTransaction = jest.fn(async () => "0xhash");

jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  http: (url: string) => httpMock(url),
  createPublicClient: () => ({ sendRawTransaction }),
}));

describe("createApi", () => {
  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
  });

  afterEach(() => {
    setCoinConfig(() => ({ info: mockCeloConfig }));
  });

  it("resolves the node from the context config", async () => {
    const context = createMockCeloContext({
      ...mockCeloConfig,
      node: { type: "external", uri: "https://from-context.invalid" },
    });

    await expect(createApi().broadcast(context, "0xdead")).resolves.toBe("0xhash");

    expect(httpMock).toHaveBeenCalledWith("https://from-context.invalid");
  });
});
