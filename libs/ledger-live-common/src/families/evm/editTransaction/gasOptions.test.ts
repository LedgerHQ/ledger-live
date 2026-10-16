import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../../../bridge/generic-coin-framework/bridge";
import { buildGenericTransactionIntent } from "../../../bridge/generic-coin-framework/buildIntent";
import { writeIntentApi } from "../../../bridge/generic-coin-framework/portfolio/intentApi";
import { mockLiveConfig } from "../../../bridge/generic-coin-framework/tests/portfolioFixtures";
import { makeAccount } from "../common.fixtures";
import { eip1559Tx } from "../transaction.fixtures";
import { editedTransactionGasOptions, networkGasOptions } from "./gasOptions";

jest.mock("../../../bridge/generic-coin-framework/api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/api/context", () => ({
  buildContext: jest.fn(() => ({ config: async () => ({}), logger: () => undefined })),
}));
jest.mock("../../../bridge/generic-coin-framework/bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(),
}));
jest.mock("../../../bridge/generic-coin-framework/portfolio/intentApi", () => ({
  writeIntentApi: jest.fn(),
}));
jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const DEAD = "0x000000000000000000000000000000000000dEaD";

/** coin-evm's gas tracker options, in memory (bigint) and in their JSON form. */
const apiGasOptions = {
  slow: { gasPrice: null, maxFeePerGas: 9n, maxPriorityFeePerGas: 1n, nextBaseFee: 4n },
  medium: { gasPrice: null, maxFeePerGas: 10n, maxPriorityFeePerGas: 2n, nextBaseFee: 4n },
  fast: { gasPrice: null, maxFeePerGas: 11n, maxPriorityFeePerGas: 3n, nextBaseFee: 4n },
};
const jsonGasOptions = {
  slow: { gasPrice: null, maxFeePerGas: "9", maxPriorityFeePerGas: "1", nextBaseFee: "4" },
  medium: { gasPrice: null, maxFeePerGas: "10", maxPriorityFeePerGas: "2", nextBaseFee: "4" },
  fast: { gasPrice: null, maxFeePerGas: "11", maxPriorityFeePerGas: "3", nextBaseFee: "4" },
};
const gasOptions = {
  slow: {
    gasPrice: null,
    maxFeePerGas: new BigNumber(9),
    maxPriorityFeePerGas: new BigNumber(1),
    nextBaseFee: new BigNumber(4),
  },
  medium: {
    gasPrice: null,
    maxFeePerGas: new BigNumber(10),
    maxPriorityFeePerGas: new BigNumber(2),
    nextBaseFee: new BigNumber(4),
  },
  fast: {
    gasPrice: null,
    maxFeePerGas: new BigNumber(11),
    maxPriorityFeePerGas: new BigNumber(3),
    nextBaseFee: new BigNumber(4),
  },
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe("editedTransactionGasOptions", () => {
  const account = makeAccount("0x055C1e159E345cB4197e3844a86A61E0a801d856", ethereum);
  const coinModuleApi = { estimateFees: jest.fn() };
  const bridgeApi = { computeIntentType: jest.fn() };
  const intent = { type: "send-eip1559", sender: account.freshAddress };
  const estimateFees = jest.fn();

  beforeEach(() => {
    jest.mocked(getCoinModuleApi).mockResolvedValue(coinModuleApi as never);
    jest.mocked(getBridgeApi).mockResolvedValue(bridgeApi as never);
    jest.mocked(buildGenericTransactionIntent).mockResolvedValue(intent as never);
    jest.mocked(writeIntentApi).mockReturnValue({ estimateFees } as never);
  });

  it("estimates the edited transaction as prepareTransaction does, with the fast preset only", async () => {
    estimateFees.mockResolvedValue({ value: 1n, parameters: { gasOptions: jsonGasOptions } });

    await expect(editedTransactionGasOptions(account, eip1559Tx)).resolves.toEqual(gasOptions);

    expect(getCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
    expect(getBridgeApi).toHaveBeenCalledWith(ethereum, "evm");
    expect(buildGenericTransactionIntent).toHaveBeenCalledWith("evm", "local", account, eip1559Tx);
    expect(writeIntentApi).toHaveBeenCalledWith(bridgeApi, coinModuleApi, account, {
      ...eip1559Tx,
    });
    // The transaction's own gas options stay out: the estimate answers fresh ones.
    expect(estimateFees).toHaveBeenCalledWith(
      jest.mocked(buildContext).mock.results[0].value,
      intent,
      {
        customFeesParameters: { feesStrategy: "fast" },
      },
    );
  });

  it.each([
    ["no parameters", undefined],
    ["parameters without gas options", { gasLimit: "21000" }],
  ])("answers none for an estimate with %s", async (_case, parameters) => {
    estimateFees.mockResolvedValue({ value: 1n, parameters });

    await expect(editedTransactionGasOptions(account, eip1559Tx)).resolves.toBeUndefined();
  });
});

describe("networkGasOptions", () => {
  const coinModule = {
    craftTransactionData: jest.fn(() => ({ type: "buffer", value: Buffer.from("") })),
    estimateFees: jest.fn(async () => ({
      value: 231_000n,
      parameters: { gasLimit: 21_000n, gasOptions: apiGasOptions },
    })),
  };

  beforeEach(() => {
    jest.mocked(getCoinModuleApi).mockResolvedValue(coinModule as never);
    jest.mocked(getBridgeApi).mockResolvedValue({});
  });

  it.each([
    [true, "send-eip1559"],
    [false, "send-legacy"],
  ])(
    "reads the gas tracker through the local side's coin module (EIP-1559: %s)",
    async (useEIP1559, type) => {
      mockLiveConfig({
        config_portfolio_service: { url: "" },
        config_currency_ethereum: { portfolio: { enabled: true, mode: "local" } },
      });

      await expect(networkGasOptions(ethereum, useEIP1559)).resolves.toEqual(gasOptions);

      // A native transfer from and to the estimation address, its nonce and gas limit set: the
      // coin module reads the gas tracker only.
      expect(coinModule.estimateFees).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type,
          sender: DEAD,
          recipient: DEAD,
          amount: 0n,
          asset: { type: "native" },
          sequence: 0n,
          feesStrategy: "fast",
        }),
        { customFeesParameters: { feesStrategy: "fast", gasLimit: 21_000n } },
      );
    },
  );

  it("sends the service the JSON form of the network parameters", async () => {
    mockLiveConfig({
      config_portfolio_service: { url: "https://portfolio.test" },
      config_currency_ethereum: { portfolio: { enabled: true, mode: "remote" } },
    });
    const service = { estimateTransactionFee: jest.fn(async () => ({ value: "0" })) };
    jest.mocked(createPortfolioServiceClient).mockReturnValue(service as never);

    await expect(networkGasOptions(ethereum, true)).resolves.toBeUndefined();

    expect(service.estimateTransactionFee).toHaveBeenCalledWith("ethereum", {
      intent: expect.objectContaining({
        networkParams: {
          sequence: "0",
          feeParameters: { feesStrategy: "fast", gasLimit: "21000" },
        },
      }),
    });
    expect(coinModule.estimateFees).not.toHaveBeenCalled();
  });
});
