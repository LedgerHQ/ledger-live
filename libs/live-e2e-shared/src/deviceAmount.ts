import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { escapeRegExp } from "./amountText";

export type DeviceAmount = { ticker: string; amount: string };

/** Reads the number printed after `label` and before `ticker` on the device screens. */
function readDeviceAmount(events: string[], label: string, ticker: string): string {
  const text = events.join("");
  const pattern = String.raw`${escapeRegExp(label)}([\d.]+)\s*${escapeRegExp(ticker)}`;
  const match = new RegExp(pattern).exec(text);
  if (!match) {
    throw new Error(`"${label}" amount in ${ticker} not found on the device screen: ${text}`);
  }
  return match[1];
}

/**
 * Formats the device amount as the review dialog does: truncated to a few significant
 * digits, without trailing zeros. The device prints the amount in full, so its own
 * decimals are enough as the unit magnitude.
 */
function formatLikeReview(deviceAmount: string, ticker: string): string {
  const magnitude = deviceAmount.split(".")[1]?.length ?? 0;
  const unit = { name: ticker, code: ticker, magnitude };
  return formatCurrencyUnit(unit, parseCurrencyUnit(unit, deviceAmount), {
    locale: "en-US",
    useGrouping: false,
  });
}

/** Checks that the amount on the device is the one the app shows, once formatted the same way. */
export function expectDeviceAmount({
  events,
  label,
  expected: { ticker, amount },
}: {
  events: string[];
  label: string;
  expected: DeviceAmount;
}) {
  const deviceAmount = readDeviceAmount(events, label, ticker);
  const shown = formatLikeReview(deviceAmount, ticker);
  if (shown !== amount) {
    throw new Error(
      `${label} amount on the device (${deviceAmount} ${ticker}) reads ${shown} in the app format, but the app shows ${amount}`,
    );
  }
}
