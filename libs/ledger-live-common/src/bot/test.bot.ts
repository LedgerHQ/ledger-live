import { setup } from "../__tests__/test-helpers/libcore-setup";
import { bot } from ".";
setup("bot");
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
