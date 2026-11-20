import type { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import BigNumber from "bignumber.js";
import { getCurrencyConfiguration } from "../../config";
import { liveConfig } from "../../config/sharedConfig";
import { readLcdBalances } from "./fixtures/lcdBalances";

const ADDRESS = "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl";

describe("readLcdBalances", () => {
  let responses: Record<string, unknown>;

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    const { lcd } = getCurrencyConfiguration<CosmosCoinConfig>("cosmos");
    responses = {
      [`${lcd}/cosmos/bank/v1beta1/balances/${ADDRESS}`]: {
        balances: [
          { denom: "uatom", amount: "1000" },
          { denom: "ibc/ABCDEF", amount: "999" },
        ],
      },
      [`${lcd}/cosmos/staking/v1beta1/delegations/${ADDRESS}`]: {
        delegation_responses: [
          { balance: { denom: "uatom", amount: "250" } },
          { balance: { denom: "uatom", amount: "50" } },
          { balance: { denom: "uosmo", amount: "7" } },
        ],
      },
      [`${lcd}/cosmos/staking/v1beta1/delegators/${ADDRESS}/unbonding_delegations`]: {
        unbonding_responses: [
          { entries: [{ balance: "30" }, { balance: "5" }] },
          { entries: [{ balance: "2" }] },
        ],
      },
    };
    jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async input => new Response(JSON.stringify(responses[String(input)])));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("adds the liquid, the delegated and the unbonding amounts of the chain denom", async () => {
    await expect(readLcdBalances("cosmos", ADDRESS)).resolves.toEqual({
      balance: new BigNumber(1337),
      spendableBalance: new BigNumber(1000),
    });
  });
});
