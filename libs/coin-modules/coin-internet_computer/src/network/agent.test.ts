import { HttpAgent } from "@dfinity/agent";
import { getAgent } from "./agent";

jest.mock("@dfinity/agent", () => ({
  HttpAgent: { create: jest.fn().mockResolvedValue({ marker: "agent" }) },
}));

describe("getAgent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates an HttpAgent for a mainnet host without fetching the root key", async () => {
    const agent = await getAgent("https://ic0.app");
    expect(HttpAgent.create).toHaveBeenCalledWith({
      host: "https://ic0.app",
      shouldFetchRootKey: false,
    });
    expect(agent).toEqual({ marker: "agent" });
  });

  it("fetches the root key for a local replica", async () => {
    await getAgent("http://127.0.0.1:8000");
    expect(HttpAgent.create).toHaveBeenCalledWith({
      host: "http://127.0.0.1:8000",
      shouldFetchRootKey: true,
    });
  });
});
