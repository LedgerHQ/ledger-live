import { selectKeyRingSession } from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  buildAddMemberIntentInput,
  buildRemoveMemberIntentInput,
  ledgerSyncResultOrder,
} from "./intents";
import { member } from "./__tests__/fixtures";

const session = selectKeyRingSession({ trustchain: mockKeyRingState() });
const client = fakeKeyRingClient();

describe("buildAddMemberIntentInput", () => {
  it("should pass the one result order of the process", () => {
    const input = buildAddMemberIntentInput({ session, client });
    expect(input).toEqual({ session, client, resultOrder: ledgerSyncResultOrder });
    expect(input.resultOrder).toBe(ledgerSyncResultOrder);
  });

  it("should leave allowTreeCreation out when the app does not set it", () => {
    expect(buildAddMemberIntentInput({ session, client })).not.toHaveProperty("allowTreeCreation");
  });

  it.each([true, false])("should pass allowTreeCreation %p when the app sets it", value => {
    expect(
      buildAddMemberIntentInput({ session, client, allowTreeCreation: value }).allowTreeCreation,
    ).toBe(value);
  });
});

describe("buildRemoveMemberIntentInput", () => {
  it("should pass the member and the one result order of the process", () => {
    const removed = member("member-2");
    expect(buildRemoveMemberIntentInput({ session, member: removed, client })).toEqual({
      session,
      member: removed,
      client,
      resultOrder: ledgerSyncResultOrder,
    });
  });
});
