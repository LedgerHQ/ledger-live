import BigNumber from "bignumber.js";
import { NetworkInfo } from "../types";
import { estimateFees } from "./estimateFees";

const mockGetServerInfos = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
}));

describe("estimateFees", () => {
  afterEach(() => {
    mockGetServerInfos.mockClear();
  });

  it("returns the default Fees", async () => {
    // Given
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          base_fee_xrp: 23,
        },
      },
    });

    // When
    const result = await estimateFees();

    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(result.networkInfo).toEqual({
      baseReserve: BigNumber(0),
      family: "xrp",
      serverFee: BigNumber(23_000_000),
    });
    expect(result.fee).toEqual(BigInt(23_000_000));
  });

  it("returns the fees from the NetworkInfo provided", async () => {
    // Given
    const networkInfo = {
      family: "xrp",
      serverFee: BigNumber(78_000_000),
      baseReserve: BigNumber("45"),
    } satisfies NetworkInfo;

    // When
    const result = await estimateFees(networkInfo);

    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(0);
    expect(result.networkInfo).toEqual(networkInfo);
    expect(result.fee).toEqual(BigInt(78_000_000));
  });
});
