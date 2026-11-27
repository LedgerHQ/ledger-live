import { agentIntentApi, agentIntentApiExtra } from "./api";
import { agentIntentService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { getAgentIntentBffUrl: () => "https://bff.agent-intent.test" };

describe("agentIntentService", () => {
  it("should register the agent intent api", () => {
    expect(agentIntentService(() => own).api).toBe(agentIntentApi);
  });

  it("should build the same extraArgument as agentIntentApiExtra", () => {
    expect(agentIntentService(() => own).buildExtra(common)).toEqual(agentIntentApiExtra(own));
  });
});
