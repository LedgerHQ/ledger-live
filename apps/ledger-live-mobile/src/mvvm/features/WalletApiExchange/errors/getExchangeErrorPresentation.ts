import type { TFunction } from "i18next";
import get from "lodash/get";
import random from "lodash/random";
import times from "lodash/times";

export type ExchangeErrorPresentation = Readonly<{
  title: string;
  description: string;
  /** The step of the swap that failed (`swap001`, `swap002`, ...), when the error carries one. */
  swapCode: string | null;
  /** Lets support find the request in the swap backend logs. */
  correlationId: string | null;
}>;

type ErrorCopy = Pick<ExchangeErrorPresentation, "title" | "description">;

const DEFAULT_ERROR_KEY = "swapErrors.default";

/** Names that say nothing about what failed, so they are no copy key. */
const GENERIC_ERROR_NAMES = new Set(["Error", "CompleteExchangeError"]);

function generateRandomString(numberOfChars = 4): string {
  return times(numberOfChars, () => random(35).toString(36))
    .join("")
    .toUpperCase();
}

/** A copy that only exists per device or platform is an object: there is no single text to use. */
function translateOrNull(t: TFunction, key: string, values: object = {}): string | null {
  const translation: unknown = t(key, { ...values, returnObjects: true });
  return typeof translation === "string" && translation !== key ? translation : null;
}

function getDefaultCopy(t: TFunction): ErrorCopy {
  return {
    title: t(`${DEFAULT_ERROR_KEY}.title`),
    description: t(`${DEFAULT_ERROR_KEY}.description`),
  };
}

function resolveMessageKeyCopy(messageKey: string | undefined, t: TFunction): ErrorCopy | null {
  if (!messageKey) return null;

  switch (messageKey) {
    case "WRONG_OR_EXPIRED_RATE_ID":
      return {
        title: t("swapErrors.swapRateExpiredError.title"),
        description: t("swapErrors.swapRateExpiredError.description"),
      };
    case "TRANSACTION_CANNOT_BE_CREATED":
      return {
        title: t("swapErrors.transactionCannotBeCreated.title"),
        description: t("swapErrors.transactionCannotBeCreated.description", {
          randomCode: generateRandomString(),
        }),
      };
    case "SWAP_QUOTE_LOW_LIQUIDITY":
      return {
        title: t("swapErrors.swapQuoteLowLiquidity.title"),
        description: t("swapErrors.swapQuoteLowLiquidity.description", {
          randomCode: generateRandomString(),
        }),
      };
    default:
      return null;
  }
}

function resolveNamespaceCopy(
  namespace: "swapErrors" | "errors",
  errorKey: string,
  values: object,
  t: TFunction,
): ErrorCopy | null {
  const title = translateOrNull(t, `${namespace}.${errorKey}.title`, values);
  const description = translateOrNull(t, `${namespace}.${errorKey}.description`, values);

  if (!title && !description) return null;

  return {
    title: title ?? t(`${DEFAULT_ERROR_KEY}.title`),
    description: description ?? t(`${DEFAULT_ERROR_KEY}.description`),
  };
}

/** The swap's own copy of the error, then the app's standard one, as `TranslatedError` shows it. */
function resolveErrorKeyCopy(
  errorKey: string | undefined,
  error: unknown,
  t: TFunction,
): ErrorCopy | null {
  if (!errorKey) return null;

  // The message is not enumerable: spread alone would leave it out of the interpolation values.
  const values = error instanceof Error ? { ...error, message: error.message } : {};
  return (
    resolveNamespaceCopy("swapErrors", errorKey, {}, t) ??
    resolveNamespaceCopy("errors", errorKey, values, t)
  );
}

function resolveFallbackCopy(error: unknown, t: TFunction): ErrorCopy {
  const message = get(error, "message");
  if (typeof message === "string") {
    return { title: message, description: t(`${DEFAULT_ERROR_KEY}.description`) };
  }

  return getDefaultCopy(t);
}

/**
 * What to tell the user about an exchange failure: the backend's own reason when it gave one, then
 * the swap or standard copy of the step or device error, then the error's message, then a generic
 * text.
 */
export function getExchangeErrorPresentation(
  error: unknown,
  t: TFunction,
): ExchangeErrorPresentation {
  const titleKey: string | undefined = get(error, "title");
  const rawName: string | undefined = get(error, "name");
  const nameKey = rawName && !GENERIC_ERROR_NAMES.has(rawName) ? rawName : undefined;
  const messageKey: string | undefined =
    get(error, "cause.response.data.error.messageKey") ?? get(error, "cause.messageKey");

  const { title, description } =
    resolveMessageKeyCopy(messageKey, t) ??
    resolveErrorKeyCopy(titleKey || nameKey, error, t) ??
    resolveFallbackCopy(error, t);

  return {
    title,
    description,
    swapCode: get(error, "cause.swapCode") ?? null,
    correlationId: get(error, "cause.correlationId") ?? null,
  };
}
