import { consumeRetryAttempt, markRetryPending } from "../addAccountAttempts";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const JOURNEY = "SelectDevice-journey-1";

describe("addAccountAttempts", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should give the attempt a retry left to its journey once, then nothing", () => {
    markRetryPending({
      currencyId: "bitcoin",
      context: "receiveFunds",
      journeyKey: JOURNEY,
      attempt: 2,
    });

    expect(
      consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds", journeyKey: JOURNEY }),
    ).toBe(2);
    expect(
      consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds", journeyKey: JOURNEY }),
    ).toBe(0);
  });

  it("should give nothing when no retry is pending", () => {
    expect(consumeRetryAttempt({ currencyId: "bitcoin", journeyKey: JOURNEY })).toBe(0);
  });

  it("should give nothing to another journey of the same currency and context, and drop the retry", () => {
    markRetryPending({
      currencyId: "bitcoin",
      context: "receiveFunds",
      journeyKey: JOURNEY,
      attempt: 1,
    });

    expect(
      consumeRetryAttempt({
        currencyId: "bitcoin",
        context: "receiveFunds",
        journeyKey: "SelectDevice-journey-2",
      }),
    ).toBe(0);
    expect(
      consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds", journeyKey: JOURNEY }),
    ).toBe(0);
  });

  it("should carry nothing over without a journey key", () => {
    markRetryPending({ currencyId: "bitcoin", attempt: 1 });
    expect(consumeRetryAttempt({ currencyId: "bitcoin", journeyKey: JOURNEY })).toBe(0);

    markRetryPending({ currencyId: "bitcoin", journeyKey: JOURNEY, attempt: 1 });
    expect(consumeRetryAttempt({ currencyId: "bitcoin" })).toBe(0);
  });

  it("should keep the retries of each currency and context apart", () => {
    markRetryPending({
      currencyId: "bitcoin",
      context: "receiveFunds",
      journeyKey: JOURNEY,
      attempt: 1,
    });

    expect(
      consumeRetryAttempt({ currencyId: "ethereum", context: "receiveFunds", journeyKey: JOURNEY }),
    ).toBe(0);
    expect(consumeRetryAttempt({ currencyId: "bitcoin", journeyKey: JOURNEY })).toBe(0);
    expect(
      consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds", journeyKey: JOURNEY }),
    ).toBe(1);
  });

  it("should still give a retry left less than 10 minutes ago", () => {
    markRetryPending({ currencyId: "bitcoin", journeyKey: JOURNEY, attempt: 1 });
    jest.advanceTimersByTime(TEN_MINUTES_MS - 1);

    expect(consumeRetryAttempt({ currencyId: "bitcoin", journeyKey: JOURNEY })).toBe(1);
  });

  it("should give nothing for a retry left 10 minutes ago or more", () => {
    markRetryPending({ currencyId: "bitcoin", journeyKey: JOURNEY, attempt: 1 });
    jest.advanceTimersByTime(TEN_MINUTES_MS);

    expect(consumeRetryAttempt({ currencyId: "bitcoin", journeyKey: JOURNEY })).toBe(0);
  });
});
