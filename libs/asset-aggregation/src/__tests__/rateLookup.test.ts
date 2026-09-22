import { getRateLookup, resetRateLookup, setRateLookup, type RateLookup } from "../rateLookup";

const lookup: RateLookup = { calculate: () => 42 };

describe("rateLookup", () => {
  beforeEach(() => {
    resetRateLookup();
  });

  afterAll(() => {
    resetRateLookup();
  });

  it("throws until the host app registers an implementation", () => {
    expect(() => getRateLookup()).toThrow(/Rate lookup is not set/);
  });

  it("returns the registered implementation", () => {
    setRateLookup(lookup);

    expect(getRateLookup()).toBe(lookup);
  });

  it("lets a later registration replace an earlier one", () => {
    const other: RateLookup = { calculate: () => 7 };
    setRateLookup(lookup);
    setRateLookup(other);

    expect(getRateLookup()).toBe(other);
  });

  it("throws again once reset", () => {
    setRateLookup(lookup);
    resetRateLookup();

    expect(() => getRateLookup()).toThrow(/Rate lookup is not set/);
  });
});
