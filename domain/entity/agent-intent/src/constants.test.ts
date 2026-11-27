import { AGENT_INTENT_HISTORY_STATUSES, AGENT_INTENT_PENDING_STATUSES } from "./constants";
import { AgentIntentStatusSchema } from "./schema";

describe("agent intent status groups", () => {
  it("should list created and crafted as pending", () => {
    expect(AGENT_INTENT_PENDING_STATUSES).toEqual(["created", "crafted"]);
  });

  it("should put every other status in history", () => {
    expect([...AGENT_INTENT_PENDING_STATUSES, ...AGENT_INTENT_HISTORY_STATUSES].sort()).toEqual(
      [...AgentIntentStatusSchema.options].sort(),
    );
  });
});
