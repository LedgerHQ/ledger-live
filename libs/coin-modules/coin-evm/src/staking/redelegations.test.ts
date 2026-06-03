import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import {
  fetchRedelegations,
  resolveRedelegationValidators,
  resolveStakingValidator,
  buildRedelegationsFromOps,
} from "./redelegations";
import { getStakingABI } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";
import { USEI_TO_EVM_SCALE } from "../utils";

jest.mock("@ledgerhq/live-network", () => jest.fn());
jest.mock("../config");
jest.mock("../network/node/rpc.common");
jest.mock("../network/node/types");

const mockNetwork = jest.mocked(require("@ledgerhq/live-network"));
const mockGetCoinConfig = jest.mocked(require("../config").getCoinConfig);
const mockWithApi = jest.mocked(require("../network/node/rpc.common").withApi);
const mockIsExternalNodeConfig = jest.mocked(require("../network/node/types").isExternalNodeConfig);

const SEI_CURRENCY = { id: "sei_evm" } as CryptoCurrency;

function encodeDelegateCalldata(validatorAddress: string): string {
  const abi = getStakingABI("sei_evm")!;
  return new ethers.Interface(abi).encodeFunctionData("delegate", [validatorAddress]);
}

function encodeUndelegateCalldata(validatorAddress: string, amountUsei: bigint): string {
  const abi = getStakingABI("sei_evm")!;
  return new ethers.Interface(abi).encodeFunctionData("undelegate", [validatorAddress, amountUsei]);
}

function encodeRedelegateCalldata(src: string, dst: string, amountUsei: bigint): string {
  const abi = getStakingABI("sei_evm")!;
  return new ethers.Interface(abi).encodeFunctionData("redelegate", [src, dst, amountUsei]);
}

function makeOperation(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "op1",
    hash: "0xdeadbeef",
    type: "DELEGATE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: 1,
    blockHash: null,
    accountId: "acc1",
    date: new Date("2025-01-01T00:00:00Z"),
    extra: {},
    hasFailed: false,
    ...overrides,
  } as unknown as Operation;
}

describe("redelegations", () => {
  describe("fetchRedelegations", () => {
    // Spy on ethers.Contract so the Sei address precompile call doesn't make a
    // real network request during tests.  By default the spy resolves to a
    // dummy Cosmos address so the REST API call is reached in most tests.
    // Individual tests that want to verify failure behaviour override it.
    let contractSpy: jest.SpyInstance;
    let providerSpy: jest.SpyInstance;
    let mockGetSeiAddr: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetSeiAddr = jest.fn().mockResolvedValue("sei1defaultcosmosaddressfortest");
      providerSpy = jest.spyOn(ethers, "JsonRpcProvider" as any).mockImplementation(() => ({}));
      contractSpy = jest
        .spyOn(ethers, "Contract" as any)
        .mockImplementation(() => ({ getSeiAddr: mockGetSeiAddr }));

      const mockNode = { type: "external", uri: "https://sei-evm.coin.ledger.com" };
      mockGetCoinConfig.mockReturnValue({ info: { node: mockNode } });
      mockIsExternalNodeConfig.mockImplementation((node: unknown) => node === mockNode);
    });

    afterEach(() => {
      contractSpy.mockRestore();
      providerSpy.mockRestore();
    });

    it("should return [] for an unknown currencyId", async () => {
      expect(await fetchRedelegations("unknown_chain", "0xabc")).toEqual([]);
    });

    it("should return [] when the strategy type is 'none'", async () => {
      expect(await fetchRedelegations("celo", "0xabc")).toEqual([]);
    });

    it("should return [] when the network call fails", async () => {
      mockNetwork.mockRejectedValue(new Error("network error"));
      expect(
        await fetchRedelegations("sei_evm", "0x1234567890abcdef1234567890abcdef12345678"),
      ).toEqual([]);
    });

    it("should return [] when the API response has no redelegation_responses", async () => {
      mockNetwork.mockResolvedValue({ data: {} });
      expect(
        await fetchRedelegations("sei_evm", "0x1234567890abcdef1234567890abcdef12345678"),
      ).toEqual([]);
    });

    it("should skip redelegations whose completion_time is already in the past", async () => {
      mockNetwork.mockResolvedValue({
        data: {
          redelegation_responses: [
            {
              redelegation: {
                delegator_address: "sei1abc",
                validator_src_address: "seivaloper1src",
                validator_dst_address: "seivaloper1dst",
              },
              entries: [
                {
                  redelegation_entry: {
                    completion_time: "2000-01-01T00:00:00Z",
                    initial_balance: "1000000",
                  },
                  balance: "1000000",
                },
              ],
            },
          ],
        },
      });
      expect(
        await fetchRedelegations("sei_evm", "0x1234567890abcdef1234567890abcdef12345678"),
      ).toEqual([]);
    });

    it("should return active redelegations with amounts scaled to 18 decimals", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const balanceUsei = "5000000";
      mockNetwork.mockResolvedValue({
        data: {
          redelegation_responses: [
            {
              redelegation: {
                delegator_address: "sei1abc",
                validator_src_address: "seivaloper1src",
                validator_dst_address: "seivaloper1dst",
              },
              entries: [
                {
                  redelegation_entry: { completion_time: futureDate, initial_balance: balanceUsei },
                  balance: balanceUsei,
                },
              ],
            },
          ],
        },
      });

      const result = await fetchRedelegations(
        "sei_evm",
        "0x1234567890abcdef1234567890abcdef12345678",
      );
      expect(result).toHaveLength(1);
      expect(result[0].validatorSrcAddress).toBe("seivaloper1src");
      expect(result[0].validatorDstAddress).toBe("seivaloper1dst");
      // 5_000_000 usei × 10^12 = 5 × 10^18 wei
      expect(result[0].amount).toStrictEqual(
        new BigNumber((BigInt(balanceUsei) * USEI_TO_EVM_SCALE).toString()),
      );
      expect(result[0].completionDate > new Date()).toBe(true);
    });

    it("should use the Sei address precompile to resolve the canonical Cosmos address", async () => {
      // The correct Sei on-chain address for 0x66c4...E1E3 is
      // sei1qpvm20rgmjq4mlf0m28l088snu8ldm05pf2c5d — NOT the bech32 encoding
      // of the EVM bytes (sei1vmzrwxhgll…).
      const evmAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
      const canonicalCosmosAddress = "sei1qpvm20rgmjq4mlf0m28l088snu8ldm05pf2c5d";
      mockGetSeiAddr.mockResolvedValueOnce(canonicalCosmosAddress);
      mockNetwork.mockResolvedValueOnce({ data: { redelegation_responses: [] } });

      await fetchRedelegations("sei_evm", evmAddress);

      expect(mockNetwork).toHaveBeenCalledTimes(1);
      const calledUrl: string = (mockNetwork.mock.calls[0][0] as { url: string }).url;
      expect(calledUrl).toContain(canonicalCosmosAddress);
      expect(calledUrl).not.toContain("sei1vmzrwxhgllkjaswzawaue7m7f9qcrc0rww3ccn");
    });

    it("should return [] when the precompile call fails (address not associated)", async () => {
      mockGetSeiAddr.mockRejectedValueOnce(new Error("not associated"));
      expect(
        await fetchRedelegations("sei_evm", "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3"),
      ).toEqual([]);
      expect(mockNetwork).not.toHaveBeenCalled();
    });
  });

  describe("resolveRedelegationValidators", () => {
    const SRC = "seivaloper1src000000000000000000000000000000000";
    const DST = "seivaloper1dst000000000000000000000000000000000";
    const AMOUNT_USEI = 3_000_000n;
    const EXPECTED_WEI = AMOUNT_USEI * USEI_TO_EVM_SCALE;

    beforeEach(() => jest.clearAllMocks());

    it("should decode from cached contractPayload in operation.extra", async () => {
      const calldata = encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI);
      const op = makeOperation({ type: "REDELEGATE", extra: { contractPayload: calldata } });

      const result = await resolveRedelegationValidators(SEI_CURRENCY, op);

      expect(result).toMatchObject({
        srcValidatorAddress: SRC,
        dstValidatorAddress: DST,
        amount: new BigNumber(EXPECTED_WEI.toString()),
      });
    });

    it("should fall back to RPC when contractPayload is absent", async () => {
      const calldata = encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI);
      mockIsExternalNodeConfig.mockReturnValue(true);
      mockGetCoinConfig.mockReturnValue({ info: { node: {} } });
      mockWithApi.mockImplementation((_currency: unknown, fn: (p: unknown) => unknown) =>
        fn({ getTransaction: async () => ({ data: calldata }) }),
      );

      const result = await resolveRedelegationValidators(
        SEI_CURRENCY,
        makeOperation({ type: "REDELEGATE", extra: {} }),
      );

      expect(result).toMatchObject({
        srcValidatorAddress: SRC,
        dstValidatorAddress: DST,
        amount: new BigNumber(EXPECTED_WEI.toString()),
      });
    });

    it("should return null when no payload is available", async () => {
      mockIsExternalNodeConfig.mockReturnValue(false);
      mockGetCoinConfig.mockReturnValue({ info: { node: {} } });

      const result = await resolveRedelegationValidators(
        SEI_CURRENCY,
        makeOperation({ type: "REDELEGATE", extra: {} }),
      );
      expect(result).toBeNull();
    });

    it("should return null for an unsupported currencyId", async () => {
      const op = makeOperation({
        type: "REDELEGATE",
        extra: { contractPayload: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) },
      });
      expect(
        await resolveRedelegationValidators({ id: "unsupported" } as CryptoCurrency, op),
      ).toBeNull();
    });

    it("should return null for malformed calldata", async () => {
      const op = makeOperation({ type: "REDELEGATE", extra: { contractPayload: "0xdeadbeef" } });
      expect(await resolveRedelegationValidators(SEI_CURRENCY, op)).toBeNull();
    });
  });

  describe("resolveStakingValidator", () => {
    const VALIDATOR = "seivaloper1val000000000000000000000000000000000";
    const AMOUNT_USEI = 2_000_000n;
    const EXPECTED_WEI = AMOUNT_USEI * USEI_TO_EVM_SCALE;

    beforeEach(() => jest.clearAllMocks());

    it("should return null for an unsupported currencyId", async () => {
      const op = makeOperation({
        type: "DELEGATE",
        extra: { contractPayload: encodeDelegateCalldata(VALIDATOR) },
      });
      expect(
        await resolveStakingValidator({ id: "unsupported" } as CryptoCurrency, op, "delegate"),
      ).toBeNull();
    });

    describe("delegate (Monad, id-keyed validatorId)", () => {
      it("resolves the validator address from the uint64 validatorId via getValidator", async () => {
        const monadIface = new ethers.Interface(getStakingABI("monad")!);
        const op = makeOperation({
          type: "DELEGATE",
          extra: { contractPayload: monadIface.encodeFunctionData("delegate", [110n]) },
        });

        mockIsExternalNodeConfig.mockReturnValue(true);
        mockGetCoinConfig.mockReturnValue({
          info: { node: { type: "external", uri: "https://monad.rpc" } },
        });
        mockWithApi.mockImplementation((_currency: unknown, fn: (p: unknown) => unknown) =>
          fn({
            call: async () =>
              monadIface.encodeFunctionResult("getValidator", [
                "0x0000000000000000000000000000000000000000",
                0n,
                0n,
                0n,
                0n,
                0n,
                0n,
                0n,
                0n,
                0n,
                "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187",
                "0x",
              ]),
          }),
        );

        const result = await resolveStakingValidator({ id: "monad" } as CryptoCurrency, op, "delegate");

        expect(result).toMatchObject({
          validatorAddress: ethers.computeAddress(
            "0x036e44a092493800e427b2b08d3427d804348b1368ecd0a6af6510ae40ce507187",
          ),
        });
      });
    });

    describe("delegate", () => {
      it("should decode validator from cached contractPayload", async () => {
        const op = makeOperation({
          type: "DELEGATE",
          extra: { contractPayload: encodeDelegateCalldata(VALIDATOR) },
        });

        const result = await resolveStakingValidator(SEI_CURRENCY, op, "delegate");

        expect(result).not.toBeNull();
        expect(result!.validatorAddress).toBe(VALIDATOR);
      });

      it("should fall back to RPC when contractPayload is absent", async () => {
        mockIsExternalNodeConfig.mockReturnValue(true);
        mockGetCoinConfig.mockReturnValue({ info: { node: {} } });
        mockWithApi.mockImplementation((_currency: unknown, fn: (p: unknown) => unknown) =>
          fn({ getTransaction: async () => ({ data: encodeDelegateCalldata(VALIDATOR) }) }),
        );

        const result = await resolveStakingValidator(
          SEI_CURRENCY,
          makeOperation({ type: "DELEGATE", extra: {} }),
          "delegate",
        );

        expect(result).not.toBeNull();
        expect(result!.validatorAddress).toBe(VALIDATOR);
      });

      it("should return null when no payload is available", async () => {
        mockIsExternalNodeConfig.mockReturnValue(false);
        mockGetCoinConfig.mockReturnValue({ info: { node: {} } });

        expect(
          await resolveStakingValidator(
            SEI_CURRENCY,
            makeOperation({ type: "DELEGATE", extra: {} }),
            "delegate",
          ),
        ).toBeNull();
      });
    });

    describe("undelegate", () => {
      it("should decode validator and scaled amount from cached contractPayload", async () => {
        const op = makeOperation({
          type: "UNDELEGATE",
          extra: { contractPayload: encodeUndelegateCalldata(VALIDATOR, AMOUNT_USEI) },
        });

        const result = await resolveStakingValidator(SEI_CURRENCY, op, "undelegate");

        expect(result).not.toBeNull();
        expect(result!.validatorAddress).toBe(VALIDATOR);
        expect(result!.amount).not.toBeNull();
        expect(result!.amount!.isEqualTo(EXPECTED_WEI.toString())).toBe(true);
      });

      it("should fall back to RPC when contractPayload is absent", async () => {
        mockIsExternalNodeConfig.mockReturnValue(true);
        mockGetCoinConfig.mockReturnValue({ info: { node: {} } });
        mockWithApi.mockImplementation((_currency: unknown, fn: (p: unknown) => unknown) =>
          fn({
            getTransaction: async () => ({
              data: encodeUndelegateCalldata(VALIDATOR, AMOUNT_USEI),
            }),
          }),
        );

        const result = await resolveStakingValidator(
          SEI_CURRENCY,
          makeOperation({ type: "UNDELEGATE", extra: {} }),
          "undelegate",
        );

        expect(result).not.toBeNull();
        expect(result!.validatorAddress).toBe(VALIDATOR);
      });

      it("should return null for malformed calldata", async () => {
        const op = makeOperation({
          type: "UNDELEGATE",
          extra: { contractPayload: "0xdeadbeef" },
        });
        expect(await resolveStakingValidator(SEI_CURRENCY, op, "undelegate")).toBeNull();
      });
    });
  });

  describe("buildRedelegationsFromOps", () => {
    const SRC = "seivaloper1src000000000000000000000000000000000";
    const DST = "seivaloper1dst000000000000000000000000000000000";
    const AMOUNT_USEI = 1_000_000n;
    const EXPECTED_WEI = AMOUNT_USEI * USEI_TO_EVM_SCALE;
    const unbondingMs = STAKING_CONTRACTS["sei_evm"].unbondingPeriodDays! * 24 * 60 * 60 * 1000;

    beforeEach(() => jest.clearAllMocks());

    it("should return [] for an unsupported currencyId", async () => {
      expect(await buildRedelegationsFromOps({ id: "unsupported" } as CryptoCurrency, [])).toEqual(
        [],
      );
    });

    it("should ignore non-REDELEGATE operations", async () => {
      expect(
        await buildRedelegationsFromOps(SEI_CURRENCY, [makeOperation({ type: "DELEGATE" })]),
      ).toEqual([]);
    });

    it("should ignore failed operations", async () => {
      const op = makeOperation({
        type: "REDELEGATE",
        hasFailed: true,
        extra: { contractPayload: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) },
        date: new Date(),
      });
      expect(await buildRedelegationsFromOps(SEI_CURRENCY, [op])).toEqual([]);
    });

    it("should ignore operations whose unbonding period has already elapsed", async () => {
      const op = makeOperation({
        type: "REDELEGATE",
        extra: { contractPayload: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) },
        date: new Date(Date.now() - unbondingMs - 1000),
      });
      expect(await buildRedelegationsFromOps(SEI_CURRENCY, [op])).toEqual([]);
    });

    it("should build a redelegation from a recent REDELEGATE op with cached calldata", async () => {
      const op = makeOperation({
        type: "REDELEGATE",
        extra: { contractPayload: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) },
        date: new Date(),
      });

      const result = await buildRedelegationsFromOps(SEI_CURRENCY, [op]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        validatorSrcAddress: SRC,
        validatorDstAddress: DST,
        amount: new BigNumber(EXPECTED_WEI.toString()),
        completionDate: expect.any(Date),
      });
      expect(result[0].completionDate > new Date()).toBe(true);
    });

    it("should fetch calldata from RPC when contractPayload is absent", async () => {
      mockIsExternalNodeConfig.mockReturnValue(true);
      mockGetCoinConfig.mockReturnValue({ info: { node: {} } });
      mockWithApi.mockImplementation((_currency: unknown, fn: (p: unknown) => unknown) =>
        fn({
          getTransaction: async () => ({ data: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) }),
        }),
      );

      const result = await buildRedelegationsFromOps(SEI_CURRENCY, [
        makeOperation({ type: "REDELEGATE", extra: {}, date: new Date() }),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].validatorSrcAddress).toBe(SRC);
    });

    it("should skip ops with malformed calldata without throwing", async () => {
      const op = makeOperation({
        type: "REDELEGATE",
        extra: { contractPayload: "0xdeadbeef" },
        date: new Date(),
      });
      expect(await buildRedelegationsFromOps(SEI_CURRENCY, [op])).toEqual([]);
    });

    it("should process multiple operations correctly", async () => {
      const ops = [
        makeOperation({
          type: "REDELEGATE",
          extra: { contractPayload: encodeRedelegateCalldata(SRC, DST, AMOUNT_USEI) },
          date: new Date(),
        }),
        makeOperation({
          type: "REDELEGATE",
          extra: { contractPayload: encodeRedelegateCalldata(DST, SRC, AMOUNT_USEI * 2n) },
          date: new Date(),
        }),
      ];

      const result = await buildRedelegationsFromOps(SEI_CURRENCY, ops);
      expect(result).toHaveLength(2);
      expect(result[0].validatorSrcAddress).toBe(SRC);
      expect(result[1].validatorSrcAddress).toBe(DST);
    });
  });
});
