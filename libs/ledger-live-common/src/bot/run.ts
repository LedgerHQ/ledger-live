import "../__tests__/test-helpers/environment";
import { bot } from ".";

export async function run(): Promise<void> {
  const { BOT_FILTER_CURRENCY, BOT_FILTER_FAMILY } = process.env;
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
}
