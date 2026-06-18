import { stakePromptCases } from "./stakePromptFixtures";
import { findRegisteredStakePromptFlowExports } from "./stakePromptFamilyFlows";

describe("NotificationsPrompt stake flow coverage guards", () => {
  it("covers every registered mobile family stake prompt flow", () => {
    expect(stakePromptCases.map(c => c.familyExportKey).sort()).toEqual(
      findRegisteredStakePromptFlowExports(),
    );
  });

  it("uses ValidationSuccess screens for every stake prompt flow", () => {
    expect(
      stakePromptCases
        .filter(c => !String(c.successScreenName).endsWith("ValidationSuccess"))
        .map(c => c.label),
    ).toEqual([]);
  });

  it("uses ValidationError screens for every stake prompt flow", () => {
    expect(stakePromptCases.filter(c => !c.errorScreenName).map(c => c.label)).toEqual([]);
    expect(
      stakePromptCases
        .filter(c => !String(c.errorScreenName).endsWith("ValidationError"))
        .map(c => c.label),
    ).toEqual([]);
  });
});
