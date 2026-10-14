import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";

jest.mock("../../prepareTransaction", () => ({
  getEstimatedFees: jest.fn(),
}));
import { getEstimatedFees } from "../../prepareTransaction";
import type { CosmosCoinConfig } from "../../config";
import { estimateFees } from "./estimateFees";

const mockedGetEstimatedFees = getEstimatedFees as jest.Mock;

// estimateFees reads only the denom off the config; the network simulate is the mocked getEstimatedFees.
const config = { denom: "uatom" } as CosmosCoinConfig;

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("logic/transaction/estimateFees", () => {
  it("maps the simulated gas to FeeEstimation value + parameters.gasLimit", async () => {
    mockedGetEstimatedFees.mockResolvedValue({
      gasWanted: new BigNumber("250000"),
      gasWantedFees: new BigNumber("6250"),
    });

    const res = await estimateFees(config, "cosmos", sendIntent);

    expect(res.value).toBe(6250n);
    expect(res.parameters?.gasLimit).toBe("250000");
  });

  it("feeds the neutral message params into getEstimatedFees", async () => {
    mockedGetEstimatedFees.mockResolvedValue({
      gasWanted: new BigNumber("1"),
      gasWantedFees: new BigNumber("1"),
    });

    await estimateFees(config, "cosmos", sendIntent);

    const [calledConfig, params] = mockedGetEstimatedFees.mock.calls[0];
    expect(calledConfig).toBe(config);
    expect(params.senderAddress).toBe("cosmos1sender");
    expect(params.currencyId).toBe("cosmos");
    expect(params.denom).toBe("uatom");
    expect(params.mode).toBe("send");
    expect(params.recipient).toBe("cosmos1recipient");
    expect(params.amount.toFixed()).toBe("1000000");
  });
});
