/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { MemoNotSupported } from "@ledgerhq/coin-module-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { buildStakingTransactionParams } from "../staking";
import { USEI_TO_EVM_SCALE } from "../utils";
import { getCallData, prepareUnsignedTxParams } from "./common";
import * as getErc20DataModule from "./getErc20Data";

jest.mock("./getErc20Data", () => {
  const actual = jest.requireActual<typeof import("./getErc20Data")>("./getErc20Data");
  return {
    getErc20Data: jest.fn((recipient: string, amount: bigint) =>
      actual.getErc20Data(recipient, amount),
    ),
  };
});

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

jest.mock("../staking", () => ({
  ...jest.requireActual("../staking"),
  buildStakingTransactionParams: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);
const mockBuildStakingTransactionParams = jest.mocked(buildStakingTransactionParams);

const getErc20DataMock = getErc20DataModule.getErc20Data as jest.Mock;

describe("common", () => {
  describe("getCallData", () => {
    beforeEach(() => {
      getErc20DataMock.mockClear();
    });

    it("should return data field from intent when available and not compute calldata", () => {
      const intent = {
        data: {
          value: Buffer.from(
            "a9059cbb000000000000000000000000d8ff72a08408b97655ee94381b8fa24ba7d6f5ac0000000000000000000000000000000000000000000000000000000000895440",
          ),
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;
      const expectedResult = Buffer.from(intent.data.value);

      const result = getCallData(intent);
      expect(result).toEqual(expectedResult);
      expect(getErc20DataMock).not.toHaveBeenCalled();
    });

    it.each([
      {
        title: "intent on native Ethereum with no amount and no recipient",
        intent: {
          asset: {
            type: "native",
          },
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
      {
        title: "intent on ERC20 token with no amount and no recipient",
        intent: {
          asset: {
            type: "erc20",
          },
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
      {
        title: "intent on ERC20 token with no recipient",
        intent: {
          asset: {
            type: "erc20",
          },
          amount: 1n,
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
      {
        title: "intent on ERC20 token with a Bitcoin address for recipient",
        intent: {
          asset: {
            type: "erc20",
          },
          amount: 1n,
          recipient: "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7", // Bitcoin address
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
      {
        title: "intent on ERC20 token with a Solana address for recipient",
        intent: {
          asset: {
            type: "erc20",
          },
          amount: 1n,
          recipient: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp", // Solana address
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
      {
        title: "intent on ERC20 token with a random text for recipient",
        intent: {
          asset: {
            type: "erc20",
          },
          amount: 1n,
          recipient: "some randon value", // Random text
        } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
    ])("should return empty buffer for invalid $title", ({ intent }) => {
      const expectedResult = Buffer.from([]);
      const result = getCallData(intent);
      expect(result).toEqual(expectedResult);
      expect(getErc20DataMock).not.toHaveBeenCalled();
    });

    it("should return calldata from contract for non native asset with a recipient and an amount", () => {
      const recipient = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
      const amount = 1n;

      const intent = {
        asset: { type: "erc20" },
        recipient,
        amount,
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const expectedResult = Buffer.from(
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
        "hex",
      );

      const result = getCallData(intent);

      expect(getErc20DataMock).toHaveBeenCalledTimes(1);
      expect(getErc20DataMock).toHaveBeenCalledWith(recipient, amount);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("prepareUnsignedTxParams — staking gas estimation retry", () => {
    const mockCurrency = {
      id: "sei_evm",
      family: "evm",
      ethereumLikeInfo: { chainId: 1329 },
    } as CryptoCurrency;

    const stakingContractAddress = "0x0000000000000000000000000000000000001005";
    const stakingData = Buffer.from("encoded-delegate-calldata");
    const GAS_ESTIMATION_ERROR = new Error(
      'execution reverted (action="estimateGas", data="0x", reason="require(false)")',
    );

    const makeStakingIntent = (amount: bigint) =>
      ({
        intentType: "staking",
        type: "staking-legacy",
        mode: "delegate",
        amount,
        asset: { type: "native" },
        recipient: stakingContractAddress,
        sender: "0xSender",
        valAddress: "seivaloper1y82m5y3wevjneamzg0pmx87dzanyxzht0kepvn",
        feesStrategy: "medium",
        data: { type: "buffer", value: Buffer.from([]) },
      }) as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

    const nodeApiMock = mockNodeApi();

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetNodeApi.mockReturnValue(nodeApiMock);
    });

    it("retries with the chain calldataAmountScale (USEI_TO_EVM_SCALE for SEI) when initial gas estimation fails for a payable staking call (value > 0)", async () => {
      const spendableBalance = 1_000_000_000_000_000_000n; // 1 SEI

      mockBuildStakingTransactionParams.mockReturnValue({
        to: stakingContractAddress,
        data: stakingData,
        value: spendableBalance, // payable: amount goes into msg.value
      });

      // First call (full balance) fails, retry (1 usei) succeeds
      nodeApiMock.getGasEstimation
        .mockRejectedValueOnce(GAS_ESTIMATION_ERROR)
        .mockResolvedValueOnce(new BigNumber(70_000));

      const result = await prepareUnsignedTxParams(
        mockCurrency,
        makeStakingIntent(spendableBalance),
      );

      expect(nodeApiMock.getGasEstimation).toHaveBeenCalledTimes(2);
      // First call used the full balance
      expect(nodeApiMock.getGasEstimation).toHaveBeenNthCalledWith(
        1,
        { currency: mockCurrency, freshAddress: "0xSender" },
        {
          amount: new BigNumber(spendableBalance.toString()),
          recipient: stakingContractAddress,
          data: stakingData,
        },
      );
      // Retry used the minimum calldata unit for the chain (calldataAmountScale)
      expect(nodeApiMock.getGasEstimation).toHaveBeenNthCalledWith(
        2,
        { currency: mockCurrency, freshAddress: "0xSender" },
        {
          amount: new BigNumber(USEI_TO_EVM_SCALE.toString()),
          recipient: stakingContractAddress,
          data: stakingData,
        },
      );
      expect(result.gasLimit).toEqual(new BigNumber(70_000));
    });

    it("retries with the chain calldataAmountScale (USEI_TO_EVM_SCALE for SEI) when initial gas estimation fails for a staking call with amount=0 (delegation form freshly opened)", async () => {
      mockBuildStakingTransactionParams.mockReturnValue({
        to: stakingContractAddress,
        data: stakingData,
        value: 0n, // amount=0 → 0 usei → precompile rejects
      });

      nodeApiMock.getGasEstimation
        .mockRejectedValueOnce(GAS_ESTIMATION_ERROR)
        .mockResolvedValueOnce(new BigNumber(70_000));

      const result = await prepareUnsignedTxParams(mockCurrency, makeStakingIntent(0n));

      expect(nodeApiMock.getGasEstimation).toHaveBeenCalledTimes(2);
      expect(nodeApiMock.getGasEstimation).toHaveBeenNthCalledWith(
        2,
        { currency: mockCurrency, freshAddress: "0xSender" },
        {
          amount: new BigNumber(USEI_TO_EVM_SCALE.toString()),
          recipient: stakingContractAddress,
          data: stakingData,
        },
      );
      expect(result.gasLimit).toEqual(new BigNumber(70_000));
    });

    it("falls back to gasLimit=0 when both the initial and retry gas estimation fail for a staking call", async () => {
      mockBuildStakingTransactionParams.mockReturnValue({
        to: stakingContractAddress,
        data: stakingData,
        value: 0n,
      });

      nodeApiMock.getGasEstimation.mockRejectedValue(GAS_ESTIMATION_ERROR);

      const result = await prepareUnsignedTxParams(mockCurrency, makeStakingIntent(0n));

      expect(nodeApiMock.getGasEstimation).toHaveBeenCalledTimes(2);
      expect(result.gasLimit).toEqual(new BigNumber(0));
    });

    it("does not retry for send transactions — falls back to gasLimit=0 on first failure without a second call", async () => {
      const sendIntent = {
        intentType: "transaction",
        type: "send-legacy",
        amount: 1n,
        asset: { type: "native" },
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        sender: "0xSender",
        feesStrategy: "medium",
        data: { type: "buffer", value: Buffer.from([]) },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      nodeApiMock.getGasEstimation.mockRejectedValueOnce(GAS_ESTIMATION_ERROR);

      const result = await prepareUnsignedTxParams(mockCurrency, sendIntent);

      expect(nodeApiMock.getGasEstimation).toHaveBeenCalledTimes(1);
      expect(result.gasLimit).toEqual(new BigNumber(0));
    });
  });
});
