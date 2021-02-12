// @flow

import { setup } from "../__tests__/test-helpers/libcore-setup";
import { bot } from ".";

setup("bot");

jest.setTimeout(110 * 60 * 1000);

const { BOT_FILTER_CURRENCY } = process.env;

test("bot", async () => {
  const arg = {};
  if (BOT_FILTER_CURRENCY) {
    arg.currency = BOT_FILTER_CURRENCY;
  }
  await bot(arg);
});
