const getEnvMock = jest.fn();
const createPublicClientMock = jest.fn();
const httpMock = jest.fn();

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: (...args: unknown[]) => getEnvMock(...args),
}));

jest.mock("viem", () => ({
  createPublicClient: (...args: unknown[]) => createPublicClientMock(...args),
  http: (...args: unknown[]) => httpMock(...args),
}));

jest.mock("viem/chains", () => ({
  celo: { id: 42220, name: "Celo" },
}));

const loadClientModule = (): typeof import("../../network/client") =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../../network/client");

describe("network/client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns a lazy singleton client", async () => {
    const { getCeloClient } = loadClientModule();
    const transport = { type: "http" };
    const requestMock = jest.fn();
    const clientMock = { request: requestMock };

    getEnvMock.mockReturnValue("https://celo-rpc.ledger.com");
    httpMock.mockReturnValue(transport);
    createPublicClientMock.mockReturnValue(clientMock);

    const first = getCeloClient();
    const second = getCeloClient();

    expect(first).toBe(second);
    expect(getEnvMock).toHaveBeenCalledWith("API_CELO_NODE");
    expect(httpMock).toHaveBeenCalledWith("https://celo-rpc.ledger.com");
    expect(createPublicClientMock).toHaveBeenCalledTimes(1);
    expect(createPublicClientMock).toHaveBeenCalledWith({
      chain: expect.objectContaining({ id: 42220, name: "Celo" }),
      transport,
    });
  });

  it("passes fee currency to eth_gasPrice when provided", async () => {
    const { celoGasPrice } = loadClientModule();
    const requestMock = jest.fn(async () => "42");
    createPublicClientMock.mockReturnValue({ request: requestMock });
    getEnvMock.mockReturnValue("https://celo-rpc.ledger.com");
    httpMock.mockReturnValue({ type: "http" });

    const feeCurrency = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;
    const gasPrice = await celoGasPrice(feeCurrency);

    expect(gasPrice).toBe(BigInt(42));
    expect(requestMock).toHaveBeenCalledWith({
      method: "eth_gasPrice",
      params: [feeCurrency],
    });
  });

  it("calls eth_gasPrice without params when fee currency is missing", async () => {
    const { celoGasPrice } = loadClientModule();
    const requestMock = jest.fn(async () => "7");
    createPublicClientMock.mockReturnValue({ request: requestMock });
    getEnvMock.mockReturnValue("https://celo-rpc.ledger.com");
    httpMock.mockReturnValue({ type: "http" });

    const gasPrice = await celoGasPrice();

    expect(gasPrice).toBe(BigInt(7));
    expect(requestMock).toHaveBeenCalledWith({
      method: "eth_gasPrice",
      params: [],
    });
  });
});
