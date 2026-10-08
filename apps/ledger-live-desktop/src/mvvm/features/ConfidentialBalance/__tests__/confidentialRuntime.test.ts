import { isConfidentialError } from "@ledgerhq/coin-evm/confidential";
import {
  createConfidentialContext,
  isRealConfidentialApi,
  resetConfidentialClient,
} from "../utils/confidentialRuntime";

const ClientMock = jest.fn(options => ({ options }) as never);
const originalEnv = { ...process.env };

beforeEach(() => {
  resetConfidentialClient();
  ClientMock.mockClear();
  process.env = { ...originalEnv };
  delete process.env.CONFIDENTIAL_API;
  delete process.env.CONFIDENTIAL_TX_SERVICE_URL;
  delete process.env.CONFIDENTIAL_SEPOLIA_RPC_URL;
});

afterAll(() => {
  process.env = originalEnv;
});

describe("confidentialRuntime", () => {
  it("runs on the mock unless CONFIDENTIAL_API is real", () => {
    expect(isRealConfidentialApi()).toBe(false);
    process.env.CONFIDENTIAL_API = "real";
    expect(isRealConfidentialApi()).toBe(true);
  });

  it("builds a coin-evm context without a client on the mock", () => {
    const context = createConfidentialContext("ethereum_sepolia", ClientMock);

    expect(context.confidential).toBeUndefined();
    expect(typeof context.config).toBe("function");
    expect(ClientMock).not.toHaveBeenCalled();
  });

  it("injects one Zama client, relayed through and preparing transfers with the oracle, in real mode", () => {
    process.env.CONFIDENTIAL_API = "real";
    process.env.CONFIDENTIAL_TX_SERVICE_URL = "http://localhost:8787";

    const first = createConfidentialContext("ethereum_sepolia", ClientMock);
    const second = createConfidentialContext("ethereum_sepolia", ClientMock);

    expect(first.confidential).toBe(second.confidential);
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith({
      rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
      relayerUrl: "http://localhost:8787/relayer",
      oracleUrl: "http://localhost:8787",
    });
  });

  it("takes the Sepolia RPC from CONFIDENTIAL_SEPOLIA_RPC_URL when set", () => {
    process.env.CONFIDENTIAL_API = "real";
    process.env.CONFIDENTIAL_TX_SERVICE_URL = "http://localhost:8787";
    process.env.CONFIDENTIAL_SEPOLIA_RPC_URL = "http://localhost:8545";

    createConfidentialContext("ethereum_sepolia", ClientMock);

    expect(ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ rpcUrl: "http://localhost:8545" }),
    );
  });

  it("is unavailable in real mode without the oracle URL", () => {
    process.env.CONFIDENTIAL_API = "real";

    let thrown: unknown;
    try {
      createConfidentialContext("ethereum_sepolia", ClientMock);
    } catch (error) {
      thrown = error;
    }

    expect(isConfidentialError(thrown, "Unavailable")).toBe(true);
  });
});
