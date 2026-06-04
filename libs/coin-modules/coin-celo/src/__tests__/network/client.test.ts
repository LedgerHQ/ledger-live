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

  describe("celoEstimateGas", () => {
    const from = "0x1111111111111111111111111111111111111111" as `0x${string}`;
    const to = "0x2222222222222222222222222222222222222222" as `0x${string}`;
    const feeCurrency = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;

    const setupClient = (returnValue: string) => {
      const requestMock = jest.fn(async () => returnValue);
      createPublicClientMock.mockReturnValue({ request: requestMock });
      getEnvMock.mockReturnValue("https://celo-rpc.ledger.com");
      httpMock.mockReturnValue({ type: "http" });
      return requestMock;
    };

    it("returns the gas estimate as a bigint", async () => {
      const { celoEstimateGas } = loadClientModule();
      const requestMock = setupClient("0x5208");

      const gas = await celoEstimateGas({ from, to });

      expect(gas).toBe(BigInt(0x5208));
      expect(requestMock).toHaveBeenCalledWith({
        method: "eth_estimateGas",
        params: [{ from, to }],
      });
    });

    it("threads feeCurrency to the RPC params when provided", async () => {
      const { celoEstimateGas } = loadClientModule();
      const requestMock = setupClient("0x1");

      await celoEstimateGas({ from, to, feeCurrency });

      expect(requestMock).toHaveBeenCalledWith({
        method: "eth_estimateGas",
        params: [{ from, to, feeCurrency }],
      });
    });

    it("hex-encodes bigint value and gas price fields", async () => {
      const { celoEstimateGas } = loadClientModule();
      const requestMock = setupClient("0x1");

      await celoEstimateGas({
        from,
        to,
        value: BigInt(1000),
        maxFeePerGas: BigInt(500),
        maxPriorityFeePerGas: BigInt(2),
      });

      expect(requestMock).toHaveBeenCalledWith({
        method: "eth_estimateGas",
        params: [
          {
            from,
            to,
            value: "0x3e8",
            maxFeePerGas: "0x1f4",
            maxPriorityFeePerGas: "0x2",
          },
        ],
      });
    });

    it("omits optional fields that are undefined", async () => {
      const { celoEstimateGas } = loadClientModule();
      const requestMock = setupClient("0x1");

      await celoEstimateGas({ from });

      expect(requestMock).toHaveBeenCalledWith({
        method: "eth_estimateGas",
        params: [{ from }],
      });
    });
  });
});
