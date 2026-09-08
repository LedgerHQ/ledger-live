import * as MinaEditMemo from "../ScreenEditMemo";
import * as MinaStakingFlow from "../StakingFlow";
import * as MinaFamily from "../index";

// Nothing is mocked here on purpose: importing the screens for real is what makes this a guard
// against an import going stale under the family, which a mock would paper over.
describe("Mina Family", () => {
  it("exports the edit memo screen with its navigation options", () => {
    expect(MinaFamily.MinaEditMemo).toBe(MinaEditMemo);
    expect(MinaFamily.MinaEditMemo.component).toBeDefined();
    expect(MinaFamily.MinaEditMemo.options).toBeDefined();
  });

  it("exports the staking navigator with its navigation options", () => {
    expect(MinaFamily.MinaStakingFlow).toBe(MinaStakingFlow);
    expect(MinaFamily.MinaStakingFlow.component).toBeDefined();
    expect(MinaFamily.MinaStakingFlow.options).toBeDefined();
  });
});
