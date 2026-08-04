import { getSwapQuotesDispatch, resetSwapQuotesStore, setSwapQuotesStore } from "./store";
import type { SwapQuotesDispatch } from "./store";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const aDispatch = (() => undefined) as unknown as SwapQuotesDispatch;

describe("swap quotes dispatch holder", () => {
  beforeEach(() => resetSwapQuotesStore());
  afterAll(() => resetSwapQuotesStore());

  it("throws until a dispatch is registered", () => {
    expect(() => getSwapQuotesDispatch()).toThrow(/Swap quotes store is not set/);
  });

  it("returns the registered dispatch", () => {
    setSwapQuotesStore(aDispatch);

    expect(getSwapQuotesDispatch()).toBe(aDispatch);
  });

  it("replaces a previously registered dispatch", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const other = (() => undefined) as unknown as SwapQuotesDispatch;
    setSwapQuotesStore(aDispatch);

    setSwapQuotesStore(other);

    expect(getSwapQuotesDispatch()).toBe(other);
  });

  it("throws again after a reset", () => {
    setSwapQuotesStore(aDispatch);

    resetSwapQuotesStore();

    expect(() => getSwapQuotesDispatch()).toThrow(/Swap quotes store is not set/);
  });
});
