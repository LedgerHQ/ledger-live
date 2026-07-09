import { userIdSelector, datadogIdSelector } from "./selectors";
import { initialIdentitiesState, DUMMY_USER_ID, DUMMY_DATADOG_ID } from "./types";
import { UserId, DatadogId } from "../ids";

const makeState = (overrides: Partial<typeof initialIdentitiesState> = {}) => ({
  identities: { ...initialIdentitiesState, ...overrides },
});

describe("userIdSelector", () => {
  it("returns the userId from state", () => {
    const userId = UserId.fromString("11111111-1111-1111-1111-111111111111");
    expect(userIdSelector(makeState({ userId }))).toBe(userId);
  });

  it("returns dummy userId when uninitialized", () => {
    expect(userIdSelector(makeState())).toEqual(DUMMY_USER_ID);
  });
});

describe("datadogIdSelector", () => {
  it("returns the datadogId from state", () => {
    const datadogId = DatadogId.fromString("22222222-2222-2222-2222-222222222222");
    expect(datadogIdSelector(makeState({ datadogId }))).toBe(datadogId);
  });

  it("returns dummy datadogId when uninitialized", () => {
    expect(datadogIdSelector(makeState())).toEqual(DUMMY_DATADOG_ID);
  });
});
