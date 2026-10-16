import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { ErrorView } from "@ledgerhq/portfolio-module-framework";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { CurrencyRegionRestrictedError } from "../../../errors";
import { isRegionRestrictionCheckEnabled } from "../regionRestriction";
import { errorRegistry } from "./errorClasses";

/** A blocked region gets the compliance page, which answers 405 (see `regionRestriction`). */
const COMPLIANCE_STATUS = 405;

/**
 * The error an `ErrorView` stands for: an instance of the class its name has in the registry of
 * `family` (`errorClasses`), so `instanceof` holds as for the error the module threw, with its name,
 * message and fields, and its cause revived the same way. A name no listed module declares gives a
 * plain `Error` carrying that name. Fields stay in their JSON form: no listed class has a field the
 * apps read typed (bigint, BigNumber, Date), they hold formatted amounts, names and counts.
 */
export function reviveError(view: ErrorView, family?: string): Error {
  const { name, message, cause, ...fields } = view;
  const ErrorClass = errorRegistry(family).get(name);
  const error = (
    ErrorClass ? Object.create(ErrorClass.prototype) : Object.create(Error.prototype)
  ) as Error & Record<string, unknown>;
  // As the Error constructor defines it.
  Object.defineProperty(error, "message", {
    value: message,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  error.name = name;
  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) error[field] = value;
  }
  if (cause) error.cause = reviveError(cause, family);
  // V8 and Hermes capture where it was revived; another engine leaves it without a stack.
  if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(error, reviveError);
  return error;
}

/**
 * The error a failed sync fails with, from what the portfolio tells of it: as the legacy path tells
 * it, a balance read the region refuses is `CurrencyRegionRestrictedError` when the currency checks
 * it (the single-address module wraps a balance failure in `UnexpectedGetBalanceError`, its cause
 * the network's answer). The legacy path never converts on the account module path, and the
 * portfolio layer's own errors are never a region's; anything else is revived as it is.
 */
export async function syncErrorFromView(
  view: ErrorView,
  currency: CryptoCurrency,
  context: Context<any>,
  { binding }: { binding: boolean },
): Promise<Error> {
  const { cause } = view;
  if (
    !binding &&
    view.name === "UnexpectedGetBalanceError" &&
    cause?.status === COMPLIANCE_STATUS
  ) {
    // The config rejects when the currency has none, which is not a region restriction.
    const config = await context.config().catch(() => undefined);
    if (isRegionRestrictionCheckEnabled(config)) {
      return new CurrencyRegionRestrictedError(currency.name, reviveError(cause, currency.family));
    }
  }
  return reviveError(view, currency.family);
}
