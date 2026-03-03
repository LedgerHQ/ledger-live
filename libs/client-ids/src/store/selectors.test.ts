import { userIdSelector, datadogIdSelector } from "./selectors";
import { UserId } from "../ids/UserId";
import { DatadogId } from "../ids/DatadogId";
import { initialIdentitiesState } from "./types";

describe("selectors", () => {
  it("userIdSelector returns state.identities.userId", () => {
    const state = { identities: initialIdentitiesState };
    const userId = userIdSelector(state);
    expect(userId).toBe(initialIdentitiesState.userId);
    expect(userId).toBeInstanceOf(UserId);
  });

  it("datadogIdSelector returns state.identities.datadogId", () => {
    const state = { identities: initialIdentitiesState };
    const datadogId = datadogIdSelector(state);
    expect(datadogId).toBe(initialIdentitiesState.datadogId);
    expect(datadogId).toBeInstanceOf(DatadogId);
  });
});
