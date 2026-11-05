export type ExchangeErrorTrackingProperties = Readonly<{ step?: string; title?: string }>;

/** Never spread the error itself: some carry wallet addresses (`AddressesSanctionedError`). */
export function getExchangeErrorTrackingProperties(
  error: unknown,
): ExchangeErrorTrackingProperties {
  if (typeof error !== "object" || error === null) return {};

  return {
    ...("step" in error && typeof error.step === "string" ? { step: error.step } : {}),
    ...("title" in error && typeof error.title === "string" ? { title: error.title } : {}),
  };
}
