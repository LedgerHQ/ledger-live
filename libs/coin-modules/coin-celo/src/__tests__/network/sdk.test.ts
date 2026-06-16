import { BigNumber } from "bignumber.js";

const getCeloClientMock = jest.fn();
const celoGasPriceMock = jest.fn();
const getRegistryAddressForMock = jest.fn();
const readContractMock = jest.fn();
const estimateMaxPriorityFeePerGasMock = jest.fn();
const requestMock = jest.fn();

jest.mock("../../network/client", () => ({
  getCeloClient: (...args: unknown[]) => getCeloClientMock(...args),
  celoGasPrice: (...args: unknown[]) => celoGasPriceMock(...args),
}));

jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: (...args: unknown[]) => getRegistryAddressForMock(...args),
}));

const loadSdkModule = (): typeof import("../../network/sdk") =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../../network/sdk");

describe("network/sdk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    getCeloClientMock.mockReturnValue({
      readContract: readContractMock,
      estimateMaxPriorityFeePerGas: estimateMaxPriorityFeePerGasMock,
      request: requestMock,
    });

    getRegistryAddressForMock.mockImplementation(async (name: string) => {
      if (name === "Accounts") return "0x000000000000000000000000000000000000aa10";
      if (name === "LockedGold") return "0x0000000000000000000000000000000000001d00";
      if (name === "Election") return "0x000000000000000000000000000000000000ce10";
      return "0x0000000000000000000000000000000000000000";
    });

    celoGasPriceMock.mockResolvedValue(BigInt(10));
    estimateMaxPriorityFeePerGasMock.mockResolvedValue(BigInt(2));
  });

  it("reads account registration status from Accounts contract", async () => {
    const { getAccountRegistrationStatus } = loadSdkModule();
    readContractMock.mockResolvedValue(true);

    const result = await getAccountRegistrationStatus("0x79D5A290D7ba4b99322d91b577589e8d0BF87072");

    expect(result).toBe(true);
    expect(getRegistryAddressForMock).toHaveBeenCalledWith("Accounts");
    expect(readContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "isAccount",
      }),
    );
  });

  it("maps and sorts pending withdrawals by timestamp", async () => {
    const { getPendingWithdrawals } = loadSdkModule();
    readContractMock.mockResolvedValue([
      [BigInt(10), BigInt(20)],
      [BigInt(200), BigInt(100)],
    ]);

    const result = await getPendingWithdrawals("0x79D5A290D7ba4b99322d91b577589e8d0BF87072");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ index: 1 });
    expect(BigNumber.isBigNumber(result[0].value)).toBe(true);
    expect(result[0].value.toString()).toBe("20");
    expect(result[0].time.toString()).toBe("100");
    expect(result[1]).toMatchObject({ index: 0 });
  });

  it("returns empty votes when group lookup fails", async () => {
    const { getVotes } = loadSdkModule();
    readContractMock.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === "voteSignerToAccount") {
        return "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";
      }
      if (functionName === "getGroupsVotedForByAccount") {
        throw new Error("revert");
      }
      return BigInt(0);
    });

    const result = await getVotes("0x79D5A290D7ba4b99322d91b577589e8d0BF87072");

    expect(result).toEqual([]);
  });

  it("returns pending and active votes for validator groups", async () => {
    const { getVotes } = loadSdkModule();
    const validatorGroup = "0x00000000000000000000000000000000000000b2";
    readContractMock.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === "voteSignerToAccount") {
        return "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";
      }
      if (functionName === "getGroupsVotedForByAccount") {
        return [validatorGroup];
      }
      if (functionName === "getPendingVotesForGroupByAccount") {
        return BigInt(5);
      }
      if (functionName === "getActiveVotesForGroupByAccount") {
        return BigInt(7);
      }
      if (functionName === "hasActivatablePendingVotes") {
        return true;
      }
      return BigInt(0);
    });

    const votes = await getVotes("0x79D5A290D7ba4b99322d91b577589e8d0BF87072");

    expect(votes).toHaveLength(2);
    const pendingVote = votes.find(vote => vote.type === "pending");
    const activeVote = votes.find(vote => vote.type === "active");

    expect(pendingVote).toMatchObject({
      validatorGroup,
      activatable: true,
      revokable: true,
      index: 0,
      type: "pending",
    });
    expect(pendingVote?.amount.toString()).toBe("5");

    expect(activeVote).toMatchObject({
      validatorGroup,
      activatable: false,
      revokable: false,
      index: 1,
      type: "active",
    });
    expect(activeVote?.amount.toString()).toBe("7");
  });

  it("caches vote signer account lookups by address", async () => {
    const { voteSignerAccount } = loadSdkModule();
    readContractMock.mockResolvedValue("0x79D5A290D7ba4b99322d91b577589e8d0BF87072");

    const address = "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";

    await voteSignerAccount(address);
    await voteSignerAccount(address);

    expect(getRegistryAddressForMock).toHaveBeenCalledTimes(1);
    expect(readContractMock).toHaveBeenCalledTimes(1);
  });

  it("computes fee market gas params with Celo formula", async () => {
    const { getFeeMarketGasParams } = loadSdkModule();
    celoGasPriceMock.mockResolvedValue(BigInt(10));
    estimateMaxPriorityFeePerGasMock.mockResolvedValue(BigInt(2));

    const params = await getFeeMarketGasParams();

    expect(params).toEqual({
      maxFeePerGas: BigInt(11),
      maxPriorityFeePerGas: BigInt(2),
    });
  });

  it("floors base fee at zero when gas price is below priority fee", async () => {
    const { getFeeMarketGasParams } = loadSdkModule();
    celoGasPriceMock.mockResolvedValue(BigInt(1));
    estimateMaxPriorityFeePerGasMock.mockResolvedValue(BigInt(5));

    const params = await getFeeMarketGasParams();

    expect(params).toEqual({
      maxFeePerGas: BigInt(5),
      maxPriorityFeePerGas: BigInt(5),
    });
  });

  describe("getCeloTransactionFeeCurrency", () => {
    const VALID_HASH = `0x${"a".repeat(64)}`;

    it("returns lowercased feeCurrency for a CIP-64 tx", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({
        type: "0x7b",
        feeCurrency: "0xAB12CD34AB12CD34AB12CD34AB12CD34AB12CD34",
      });

      const result = await getCeloTransactionFeeCurrency(VALID_HASH);

      expect(result).toBe("0xab12cd34ab12cd34ab12cd34ab12cd34ab12cd34");
      expect(requestMock).toHaveBeenCalledWith({
        method: "eth_getTransactionByHash",
        params: [VALID_HASH],
      });
    });

    it("treats mixed-case `0x7B` as CIP-64", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({
        type: "0x7B",
        feeCurrency: "0xAB12CD34AB12CD34AB12CD34AB12CD34AB12CD34",
      });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).resolves.toBe(
        "0xab12cd34ab12cd34ab12cd34ab12cd34ab12cd34",
      );
    });

    it("returns null for a non-CIP-64 tx", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ type: "0x2", feeCurrency: null });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).resolves.toBeNull();
    });

    it("returns null when the response omits the `type` field", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ feeCurrency: null });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).resolves.toBeNull();
    });

    it("throws when the node returns null (tx not found)", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce(null);

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(/not found/);
    });

    it("throws synchronously on a malformed hash", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();

      await expect(getCeloTransactionFeeCurrency("0xnothex")).rejects.toThrow(
        /Invalid Celo tx hash/,
      );
      expect(requestMock).not.toHaveBeenCalled();
    });

    it("throws when a CIP-64 tx is missing `feeCurrency` (no silent native fallback)", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ type: "0x7b", feeCurrency: null });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(
        /CIP-64 but feeCurrency is missing/,
      );
    });

    it("rejects responses with a non-string `type`", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ type: 123, feeCurrency: null });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(/not found/);
    });

    it("rejects responses with a malformed `feeCurrency` (no 0x prefix)", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ type: "0x7b", feeCurrency: "deadbeef" });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(/not found/);
    });

    it("rejects responses with a too-short `feeCurrency`", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({ type: "0x7b", feeCurrency: "0x1" });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(/not found/);
    });

    it("rejects responses with non-hex characters in `feeCurrency`", async () => {
      const { getCeloTransactionFeeCurrency } = loadSdkModule();
      requestMock.mockResolvedValueOnce({
        type: "0x7b",
        feeCurrency: "0xZZ12CD34AB12CD34AB12CD34AB12CD34AB12CD34",
      });

      await expect(getCeloTransactionFeeCurrency(VALID_HASH)).rejects.toThrow(/not found/);
    });
  });
});
