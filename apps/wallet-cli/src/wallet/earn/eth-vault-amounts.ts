import type { NormalizedDefiProduct } from "./normalize";

function extractHumanAmount(input: string): string {
  const trimmed = input.trim();
  if (/^[+-]?\d+(?:\.\d+)?e[+-]?\d+$/i.test(trimmed)) {
    throw new Error(`Invalid amount "${input}". Expected a positive decimal amount.`);
  }
  const match =
    /^(\d+(?:\.\d+)?)\s*[A-Za-z][A-Za-z0-9._-]*$/.exec(trimmed) ??
    /^[A-Za-z][A-Za-z0-9._-]*\s+(\d+(?:\.\d+)?)$/.exec(trimmed) ??
    /^(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid amount "${input}". Expected a positive decimal amount.`);
  }
  return match[1];
}

/** Extract the (optional) ticker portion of an amount input like "100 USDC" / "USDC 100". */
function extractAmountTicker(input: string): string | undefined {
  const trimmed = input.trim();
  const match =
    /^\d+(?:\.\d+)?\s*([A-Za-z][A-Za-z0-9._-]*)$/.exec(trimmed) ??
    /^([A-Za-z][A-Za-z0-9._-]*)\s+\d+(?:\.\d+)?$/.exec(trimmed);
  return match?.[1];
}

/**
 * Reject an `--amount` whose ticker does not name the vault asset.
 *
 * The ticker is optional (a bare number is accepted), but the amount is always converted with the
 * vault's own `asset_decimals` regardless of the ticker, so without this check a typo like
 * `100 DAI` into a USDC vault would silently deposit USDC. Validation is skipped only when the
 * product carries no `asset_symbol` (nothing to validate against).
 */
export function assertAmountTickerMatchesAsset(
  input: string,
  product: NormalizedDefiProduct,
): void {
  const ticker = extractAmountTicker(input);
  if (ticker === undefined) return;
  const assetSymbol = product.assetSymbol;
  if (!assetSymbol) return;
  if (ticker.toLowerCase() !== assetSymbol.toLowerCase()) {
    throw new Error(
      `Amount ticker "${ticker}" does not match the vault asset "${assetSymbol}". ` +
        `Use the vault's asset, e.g. '<amount> ${assetSymbol}'.`,
    );
  }
}

export function parseAmountToBaseUnits(input: string, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid asset decimals: ${decimals}.`);
  }
  const amount = extractHumanAmount(input);
  const [whole, fraction = ""] = amount.split(".");
  if (fraction.length > decimals) {
    throw new Error(
      `Amount "${input}" has too many decimal places for an asset with ${decimals} decimals.`,
    );
  }
  const paddedFraction = fraction.padEnd(decimals, "0");
  const baseUnits = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "") || "0";
  if (baseUnits === "0") {
    throw new Error(`Amount "${input}" must be greater than zero.`);
  }
  return baseUnits;
}
