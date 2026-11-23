import { escapeRegExp } from "./amountText";

export type DeviceAmount = { ticker: string; amount: string };

/** Reads the number printed after `label` and before `ticker` on the device screens. */
function readDeviceAmount(events: string[], label: string, ticker: string): string {
  const text = events.join("");
  const match = new RegExp(`${escapeRegExp(label)}([\\d.]+)\\s*${escapeRegExp(ticker)}`).exec(text);
  if (!match) {
    throw new Error(`"${label}" amount in ${ticker} not found on the device screen: ${text}`);
  }
  return match[1];
}

const decimalsOf = (amount: string) => amount.split(".")[1]?.length ?? 0;

/** Exact integer value of `amount` in units of 10^-decimals, without floating point. */
function toUnits(amount: string, decimals: number): bigint {
  const [integer, fraction = ""] = amount.split(".");
  return BigInt(integer + fraction.padEnd(decimals, "0").slice(0, decimals));
}

/**
 * Checks the device amount against the one the app displays.
 * The app truncates to its own decimals, so the device amount, printed in full, is allowed
 * to differ from it by less than one unit of the app's last digit.
 * Compared as integers: large or 18-decimal amounts do not fit a double.
 */
export function expectDeviceAmount({
  events,
  label,
  expected: { ticker, amount: appAmount },
}: {
  events: string[];
  label: string;
  expected: DeviceAmount;
}) {
  const deviceAmount = readDeviceAmount(events, label, ticker);
  const decimals = Math.max(decimalsOf(appAmount), decimalsOf(deviceAmount));
  const expectedUnits = toUnits(appAmount, decimals);
  const actual = toUnits(deviceAmount, decimals);
  const lastDigit = 10n ** BigInt(decimals - decimalsOf(appAmount));
  const difference = actual > expectedUnits ? actual - expectedUnits : expectedUnits - actual;
  if (difference >= lastDigit) {
    throw new Error(
      `${label} amount on the device (${deviceAmount} ${ticker}) differs from the app (${appAmount} ${ticker})`,
    );
  }
}
