import { setCountervaluesState, wipeCountervalues } from "./actions";

describe("countervalues rates actions", () => {
  it.each([
    [setCountervaluesState, "COUNTERVALUES_STATE_SET"],
    [wipeCountervalues, "COUNTERVALUES_WIPE"],
  ])("keeps the action type string %#: %s", (creator, type) => {
    expect(creator.type).toBe(type);
  });
});
