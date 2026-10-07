import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { BigNumber } from "bignumber.js";
import type { TronCoinConfig } from "../../config";
import { decode58Check } from "../../network/format";
import { EnergyRentProviderNotConfigured } from "../../types/errors";
import {
  DEFAULT_TRONIFY_MAX_RENT_AMOUNT,
  DEFAULT_TRONIFY_RENT_PRICE_MARGIN,
  TRONIFY_PAY_ASSET,
} from "../constants";

const TRON_ADDRESS_HEX = /^41[0-9a-f]{40}$/;

function tronAddressHex(address: unknown): string | null {
  if (typeof address !== "string") return null;
  try {
    const hex = decode58Check(address).toLowerCase();
    return TRON_ADDRESS_HEX.test(hex) ? hex : null;
  } catch {
    return null;
  }
}

/** The addresses a rent payment may go to, as lower-case 41-prefixed hex. Throws unless coin-config
 * lists at least one and every entry is valid, so a bad entry disables the option rather than
 * dropping a payee. */
export function tronifyPaymentAddresses(config: TronCoinConfig): ReadonlySet<string> {
  const listed: unknown = config.energyRent?.tronify?.paymentAddresses;
  const addresses = Array.isArray(listed) ? listed.map(tronAddressHex) : [];
  if (addresses.length === 0 || addresses.includes(null)) {
    throw new EnergyRentProviderNotConfigured(
      "Tronify payment addresses are missing or invalid in coin-config",
    );
  }
  return new Set(addresses as string[]);
}

function readNumber(
  logger: Logger,
  value: unknown,
  fallback: number,
  isValid: (value: number) => boolean,
  name: string,
): number {
  if (value === undefined) return fallback;
  if (typeof value === "number" && Number.isFinite(value) && isValid(value)) return value;
  logger("tron/energyRent", `ignoring invalid coin-config ${name}, using default`, { value });
  return fallback;
}

/** The most one rental may cost, in USDT base units. */
export function maxRentBaseUnits(logger: Logger, config: TronCoinConfig): BigNumber {
  const usdt = readNumber(
    logger,
    config.energyRent?.tronify?.maxRentAmount,
    DEFAULT_TRONIFY_MAX_RENT_AMOUNT,
    value => value > 0,
    "maxRentAmount",
  );
  return new BigNumber(usdt)
    .shiftedBy(TRONIFY_PAY_ASSET.unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR);
}

export function rentPriceMargin(logger: Logger, config: TronCoinConfig): number {
  return readNumber(
    logger,
    config.energyRent?.tronify?.rentPriceMargin,
    DEFAULT_TRONIFY_RENT_PRICE_MARGIN,
    value => value >= 0 && value < 1,
    "rentPriceMargin",
  );
}
