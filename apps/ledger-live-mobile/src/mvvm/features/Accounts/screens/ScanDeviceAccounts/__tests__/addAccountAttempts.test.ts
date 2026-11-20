import { consumeRetryAttempt, markRetryPending } from "../addAccountAttempts";

const TEN_MINUTES_MS = 10 * 60 * 1000;

describe("addAccountAttempts", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should give the attempt a retry left once, then nothing", () => {
    markRetryPending({ currencyId: "bitcoin", context: "receiveFunds", attempt: 2 });

    expect(consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds" })).toBe(2);
    expect(consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds" })).toBe(0);
  });

  it("should give nothing when no retry is pending", () => {
    expect(consumeRetryAttempt({ currencyId: "bitcoin" })).toBe(0);
  });

  it("should keep the retries of each currency and context apart", () => {
    markRetryPending({ currencyId: "bitcoin", context: "receiveFunds", attempt: 1 });

    expect(consumeRetryAttempt({ currencyId: "ethereum", context: "receiveFunds" })).toBe(0);
    expect(consumeRetryAttempt({ currencyId: "bitcoin" })).toBe(0);
    expect(consumeRetryAttempt({ currencyId: "bitcoin", context: "receiveFunds" })).toBe(1);
  });

  it("should still give a retry left less than 10 minutes ago", () => {
    markRetryPending({ currencyId: "bitcoin", attempt: 1 });
    jest.advanceTimersByTime(TEN_MINUTES_MS - 1);

    expect(consumeRetryAttempt({ currencyId: "bitcoin" })).toBe(1);
  });

  it("should give nothing for a retry left 10 minutes ago or more", () => {
    markRetryPending({ currencyId: "bitcoin", attempt: 1 });
    jest.advanceTimersByTime(TEN_MINUTES_MS);

    expect(consumeRetryAttempt({ currencyId: "bitcoin" })).toBe(0);
  });
});
