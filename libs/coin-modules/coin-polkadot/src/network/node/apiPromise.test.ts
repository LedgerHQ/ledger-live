import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { polkadotMainnetConfigValue } from "../../test/config.fixture";
import getApiPromise from "./apiPromise";

jest.mock("@polkadot/api", () => ({
  ApiPromise: { create: jest.fn() },
  HttpProvider: jest.fn(),
  WsProvider: jest.fn(),
}));

const mockCreate = jest.mocked(ApiPromise.create);
const mockHttpProvider = jest.mocked(HttpProvider);
const mockWsProvider = jest.mocked(WsProvider);

const configFor = (node: { url: string; credentials?: string }) => ({
  ...polkadotMainnetConfigValue,
  node,
});

describe("getApiPromise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockImplementation(async () => ({ disconnect: jest.fn() }) as unknown as ApiPromise);
  });

  it("disconnects the previous connection when the credentials of a node url change", async () => {
    const first = await getApiPromise(
      configFor({ url: "https://rotate.mock/node", credentials: "one" }),
    );

    const second = await getApiPromise(
      configFor({ url: "https://rotate.mock/node", credentials: "two" }),
    );

    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(second.disconnect).not.toHaveBeenCalled();
  });

  it("disconnects the least recently used connection beyond the pool size", async () => {
    const [oldest, ...others] = await Promise.all(
      Array.from({ length: 9 }, (_, index) =>
        getApiPromise(configFor({ url: `https://pool-${index}.mock/node` })),
      ),
    );

    expect(oldest.disconnect).toHaveBeenCalledTimes(1);
    others.forEach(api => expect(api.disconnect).not.toHaveBeenCalled());
  });

  it("reuses the connection for the same node url and credentials", async () => {
    const config = configFor({ url: "https://reuse.mock/node", credentials: "abc" });

    const first = await getApiPromise(config);
    const second = await getApiPromise({ ...config });

    expect(second).toBe(first);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("opens a distinct connection for another node url", async () => {
    await getApiPromise(configFor({ url: "https://first.mock/node" }));
    await getApiPromise(configFor({ url: "https://second.mock/node" }));

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("opens a distinct connection for other credentials on the same node url", async () => {
    await getApiPromise(configFor({ url: "https://creds.mock/node", credentials: "one" }));
    await getApiPromise(configFor({ url: "https://creds.mock/node", credentials: "two" }));

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("uses a websocket provider for ws urls", async () => {
    await getApiPromise(configFor({ url: "wss://ws.mock/node" }));

    expect(mockWsProvider).toHaveBeenCalledWith("wss://ws.mock/node");
    expect(mockHttpProvider).not.toHaveBeenCalled();
  });

  it("sends the credentials as a basic authorization header on http urls", async () => {
    await getApiPromise(configFor({ url: "https://auth.mock/node", credentials: "secret" }));

    expect(mockHttpProvider).toHaveBeenCalledWith("https://auth.mock/node", {
      Authorization: "Basic secret",
    });
  });

  it("rejects an invalid node url", async () => {
    await expect(getApiPromise(configFor({ url: "ftp://invalid.mock/node" }))).rejects.toThrow(
      "[Polkadot] Invalid node URL",
    );
  });

  it("retries the connection after a failure", async () => {
    const config = configFor({ url: "https://flaky.mock/node" });
    mockCreate.mockRejectedValueOnce(new Error("offline"));

    await expect(getApiPromise(config)).rejects.toThrow("offline");
    await getApiPromise(config);

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
