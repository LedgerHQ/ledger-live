const mockCreate = jest.fn();

jest.mock("@icp-sdk/core/agent", () => ({
  HttpAgent: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

import { getAgent } from "./agent";

describe("getAgent", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it("should create an HttpAgent with the given host", async () => {
    const mockAgent = { host: "https://ic0.app" };
    mockCreate.mockResolvedValue(mockAgent);

    const result = await getAgent("https://ic0.app");

    expect(result).toBe(mockAgent);
    expect(mockCreate).toHaveBeenCalledWith({
      host: "https://ic0.app",
      shouldFetchRootKey: true,
    });
  });

  it("should pass through a custom host", async () => {
    const mockAgent = { host: "https://custom.ic.app" };
    mockCreate.mockResolvedValue(mockAgent);

    const result = await getAgent("https://custom.ic.app");

    expect(result).toBe(mockAgent);
    expect(mockCreate).toHaveBeenCalledWith({
      host: "https://custom.ic.app",
      shouldFetchRootKey: true,
    });
  });

  it("should propagate errors from HttpAgent.create", async () => {
    mockCreate.mockRejectedValue(new Error("Network error"));

    await expect(getAgent("https://ic0.app")).rejects.toThrow("Network error");
  });
});
