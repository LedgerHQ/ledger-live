import network from "@ledgerhq/live-network";
import hederaCoinConfig from "../config";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import { getCurrencyToUSDRate } from "../network/utils";
import { getMockedConfig, getMockedContext } from "../test/fixtures/config.fixture";
import { createApi } from ".";

jest.mock("@ledgerhq/live-network");

const mockedNetwork = jest.mocked(network);

describe("createApi", () => {
  beforeEach(() => {
    getCurrencyToUSDRate.reset();
    // The api path must not depend on the module singleton, whatever it holds.
    hederaCoinConfig.setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    mockedNetwork.mockResolvedValue({ data: { hedera: 0.07 } } as Awaited<
      ReturnType<typeof network>
    >);
  });

  afterEach(() => {
    hederaCoinConfig.setCoinConfig(() => getMockedConfig());
  });

  it("resolves the countervalues endpoint from the context config", async () => {
    const context = getMockedContext({
      infra: { LEDGER_COUNTERVALUES_API: "https://from-context.invalid" },
    });
    const intent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      asset: { type: "native" },
      sender: "0.0.1001",
      recipient: "0.0.1002",
      amount: 1n,
    } as unknown as Parameters<ReturnType<typeof createApi>["estimateFees"]>[1];

    await createApi("hedera").estimateFees(context, intent);

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://from-context.invalid/v3/spot/simple?to=USD&froms=hedera",
      }),
    );
  });
});
