import coinConfig from "../../config";
import { queryPreorderInfo } from "./index";

// Credentials/channel are not committed. Provide them via the integ env to run this suite:
//   TRONIFY_URL, TRONIFY_SOURCE_FLAG, (optional) TRONIFY_API_KEY
// Only queryPreorderInfo is exercised — it is a read-only quote. addTronRentRecord/uploadHash
// create real, paid orders and must run against a Tronify sandbox (reconciliation Q10).
const { TRONIFY_URL, TRONIFY_SOURCE_FLAG, TRONIFY_API_KEY } = process.env;
const run = TRONIFY_URL && TRONIFY_SOURCE_FLAG ? describe : describe.skip;

const RECEIVER = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

run("tronify queryPreorderInfo [integ]", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
      energyRent: {
        provider: "tronify",
        tronify: {
          url: TRONIFY_URL as string,
          sourceFlag: TRONIFY_SOURCE_FLAG as string,
          apiKey: TRONIFY_API_KEY,
        },
      },
    }));
  });

  it("returns a priced quote for a 10-minute, 32000-energy rental", async () => {
    const quote = await queryPreorderInfo({
      fromAddress: RECEIVER,
      pledgeAddress: RECEIVER,
      pledgeNum: 32000,
      pledgeDay: "0",
      pledgeHour: "0",
      pledgeMinute: "10",
      extraTrxNum: "0",
    });

    expect(quote.pledgeNum).toBe(32000);
    expect(Number(quote.payCoinAmt)).toBeGreaterThan(0);
    expect(quote.payCoinCode.length).toBeGreaterThan(0);
  });
});
