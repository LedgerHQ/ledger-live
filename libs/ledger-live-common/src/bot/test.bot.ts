import "../__tests__/test-helpers/setup";
import { bot } from ".";

jest.setTimeout(110 * 60 * 1000);
const { BOT_FILTER_CURRENCY, BOT_FILTER_FAMILY } = process.env;
test("bot", async () => {
  const arg: {
    currency?: string;
    family?: string;
  } = {};

  if (BOT_FILTER_CURRENCY) {
    arg.currency = BOT_FILTER_CURRENCY;
  }

  if (BOT_FILTER_FAMILY) {
    arg.family = BOT_FILTER_FAMILY;
  }

  await bot(arg);
});
