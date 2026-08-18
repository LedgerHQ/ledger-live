import * as env from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import {
  fetchCallReadOnlyFunction,
  noneCV,
  principalCV,
  someCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { fetchEarnedStakerRewards, fetchPoxInfo, fetchStakerInfo } from "./pox";

jest.mock("@ledgerhq/live-env");
jest.mock("@ledgerhq/live-network/network");
jest.mock("@stacks/transactions", () => ({
  ...jest.requireActual("@stacks/transactions"),
  fetchCallReadOnlyFunction: jest.fn(),
}));

const POX_CONTRACT = "SP000000000000000000002Q6VF78.pox-5";
const STAKER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const SIGNER = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.native-pool-signer-manager";

describe("network/pox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env.getEnv as jest.Mock).mockReturnValue("https://stacks.example");
  });

  it("fetchPoxInfo GETs /v2/pox", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({
      data: { contract_id: POX_CONTRACT },
    });

    const result = await fetchPoxInfo();

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "https://stacks.example/v2/pox" }),
    );
    expect(result).toEqual({ contract_id: POX_CONTRACT });
  });

  it("fetchStakerInfo decodes a real get-staker-info some(tuple) response", async () => {
    (fetchCallReadOnlyFunction as jest.Mock).mockResolvedValue(
      someCV(
        tupleCV({
          "amount-ustx": uintCV(200000000000),
          "first-reward-cycle": uintCV(100),
          "num-cycles": uintCV(96),
          signer: principalCV(SIGNER),
        }),
      ),
    );

    const result = await fetchStakerInfo(POX_CONTRACT, STAKER);

    expect(result).toEqual({
      amountUstx: 200000000000n,
      firstRewardCycle: 100,
      numCycles: 96,
      signer: SIGNER,
    });
    expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        contractAddress: "SP000000000000000000002Q6VF78",
        contractName: "pox-5",
        functionName: "get-staker-info",
        senderAddress: STAKER,
      }),
    );
  });

  it("fetchStakerInfo returns undefined on a none response", async () => {
    (fetchCallReadOnlyFunction as jest.Mock).mockResolvedValue(noneCV());

    await expect(fetchStakerInfo(POX_CONTRACT, STAKER)).resolves.toBeUndefined();
  });

  it("fetchEarnedStakerRewards decodes a real uint response", async () => {
    (fetchCallReadOnlyFunction as jest.Mock).mockResolvedValue(uintCV(500));

    await expect(fetchEarnedStakerRewards(POX_CONTRACT, SIGNER, 141, STAKER)).resolves.toBe(500n);
    expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "get-earned-staker-rewards", senderAddress: STAKER }),
    );
  });

  it("fetchEarnedStakerRewards returns 0n when nothing has accrued", async () => {
    (fetchCallReadOnlyFunction as jest.Mock).mockResolvedValue(uintCV(0));

    await expect(fetchEarnedStakerRewards(POX_CONTRACT, SIGNER, 141, STAKER)).resolves.toBe(0n);
  });

  it("fetchStakerInfo throws a clear error when the API base URL is unset", async () => {
    (env.getEnv as jest.Mock).mockReturnValue(undefined);

    await expect(fetchStakerInfo(POX_CONTRACT, STAKER)).rejects.toThrow(
      "API base URL not available",
    );
    expect(fetchCallReadOnlyFunction).not.toHaveBeenCalled();
  });

  it("fetchEarnedStakerRewards throws a clear error when the API base URL is unset", async () => {
    (env.getEnv as jest.Mock).mockReturnValue(undefined);

    await expect(fetchEarnedStakerRewards(POX_CONTRACT, SIGNER, 141, STAKER)).rejects.toThrow(
      "API base URL not available",
    );
    expect(fetchCallReadOnlyFunction).not.toHaveBeenCalled();
  });
});
