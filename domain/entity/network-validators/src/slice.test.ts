import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import { mockNetworkValidator } from "./schema.mock";
import reducer, {
  networkValidatorsFailed,
  networkValidatorsInitialState,
  networkValidatorsReceived,
  networkValidatorsRequested,
  networkValidatorsSlice,
  selectNetworkValidator,
  selectNetworkValidators,
  selectNetworkValidatorsEntry,
} from "./slice";
import { mockNetworkId, mockNetworkValidatorsState } from "./slice.mock";

const networkId = mockNetworkId;
const validators = [mockNetworkValidator()];
const error = { name: "TypeError", message: "down" };

describe("networkValidatorsSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "" })).toEqual(networkValidatorsInitialState);
  });

  it("marks a read pending, then stores its answer and clears the error", () => {
    let state = reducer(undefined, networkValidatorsRequested({ networkId, requestId: "a" }));
    expect(state[networkId]).toEqual({ validators: [], pending: { requestId: "a" } });
    state = reducer(state, networkValidatorsFailed({ networkId, requestId: "a", error }));
    state = reducer(state, networkValidatorsRequested({ networkId, requestId: "b" }));
    state = reducer(
      state,
      networkValidatorsReceived({ networkId, requestId: "b", validators, receivedAt: 1 }),
    );
    expect(state[networkId]).toEqual({ validators, receivedAt: 1 });
  });

  it("drops the answer of a read a newer one replaced", () => {
    let state = reducer(undefined, networkValidatorsRequested({ networkId, requestId: "a" }));
    state = reducer(state, networkValidatorsRequested({ networkId, requestId: "b" }));
    state = reducer(
      state,
      networkValidatorsReceived({ networkId, requestId: "a", validators, receivedAt: 1 }),
    );
    state = reducer(state, networkValidatorsFailed({ networkId, requestId: "a", error }));
    expect(state[networkId]).toEqual({ validators: [], pending: { requestId: "b" } });
  });

  it("keeps the stored validators on a failure", () => {
    let state = reducer(
      mockNetworkValidatorsState,
      networkValidatorsRequested({ networkId, requestId: "a" }),
    );
    state = reducer(state, networkValidatorsFailed({ networkId, requestId: "a", error }));
    expect(state[networkId]).toEqual({ ...mockNetworkValidatorsState[networkId], error });
  });
});

describe("selectors", () => {
  const root = { [networkValidatorsSlice.name]: mockNetworkValidatorsState };
  const other = NetworkIdSchema.parse("osmo");

  it("selects a network's entry and validators", () => {
    expect(selectNetworkValidatorsEntry(root, networkId)).toBe(
      mockNetworkValidatorsState[networkId],
    );
    expect(selectNetworkValidators(root, networkId)).toHaveLength(2);
    expect(selectNetworkValidators(root, other)).toBeUndefined();
  });

  it("selects one validator by id", () => {
    expect(selectNetworkValidator(root, networkId, "cosmosvaloper1other")?.name).toBe("Other");
    expect(selectNetworkValidator(root, networkId, "missing")).toBeUndefined();
    expect(selectNetworkValidator(root, other, "cosmosvaloper1other")).toBeUndefined();
  });
});
