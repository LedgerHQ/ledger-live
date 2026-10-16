import type { ChainAPI } from "../../network";
import { getAccountInfo } from "../getAccountInfo";
import { getTokenAccountShapes } from "../tokenAccountShapes";

jest.mock("../tokenAccountShapes", () => ({
  getTokenAccountShapes: jest.fn(),
}));

const mockGetTokenAccountShapes = jest.mocked(getTokenAccountShapes);
const api = {} as ChainAPI;
const OWNER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TOKEN_2022 = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

describe("getAccountInfo", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reports the token account shapes of the address, keyed by mint", async () => {
    mockGetTokenAccountShapes.mockResolvedValueOnce({
      [USDC]: { state: "frozen" },
      [TOKEN_2022]: {
        state: "initialized",
        extensions: {
          interestRate: { rateBps: 500, accruedDelta: 12 },
          transferFee: { feeBps: 30, maxFee: 1000 },
          nonTransferable: true,
        },
      },
    });

    const info = await getAccountInfo(api, OWNER);

    expect(mockGetTokenAccountShapes).toHaveBeenCalledWith(api, OWNER);
    expect(info).toEqual({
      type: "solana",
      tokenAccounts: {
        [USDC]: { state: "frozen" },
        [TOKEN_2022]: {
          state: "initialized",
          extensions: {
            interestRate: { rateBps: 500, accruedDelta: 12 },
            transferFee: { feeBps: 30, maxFee: 1000 },
            nonTransferable: true,
          },
        },
      },
    });
  });

  it("answers a JSON value, without the fields left undefined", async () => {
    mockGetTokenAccountShapes.mockResolvedValueOnce({
      [TOKEN_2022]: {
        extensions: {
          interestRate: { rateBps: 500, accruedDelta: undefined },
          permanentDelegate: { delegateAddress: undefined },
        },
      },
    });

    const info = await getAccountInfo(api, OWNER);

    expect(info.tokenAccounts[TOKEN_2022]).toStrictEqual({
      extensions: { interestRate: { rateBps: 500 }, permanentDelegate: {} },
    });
    expect(JSON.parse(JSON.stringify(info))).toStrictEqual(info);
  });

  it("reports no token account for an address holding none", async () => {
    mockGetTokenAccountShapes.mockResolvedValueOnce({});

    await expect(getAccountInfo(api, OWNER)).resolves.toEqual({
      type: "solana",
      tokenAccounts: {},
    });
  });

  it("fails when the RPC read fails", async () => {
    mockGetTokenAccountShapes.mockRejectedValueOnce(new Error("RPC down"));

    await expect(getAccountInfo(api, OWNER)).rejects.toThrow("RPC down");
  });
});
