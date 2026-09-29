import { planPayCardMilestoneReports } from "./planPayCardMilestoneReports";

const observed = [
  { id: "card-claimed" },
  { id: "card-onboarding-completed" },
] as const satisfies Parameters<typeof planPayCardMilestoneReports>[0]["observed"];

describe("planPayCardMilestoneReports", () => {
  it("sends what the account reached while this install was watching", () => {
    const plan = planPayCardMilestoneReports({ observed, reported: [], isFirstRead: false });

    expect(plan.send).toEqual(observed);
    expect(plan.record).toEqual(["card-claimed", "card-onboarding-completed"]);
  });

  it("writes off, without sending, what a first read finds already achieved", () => {
    const plan = planPayCardMilestoneReports({ observed, reported: [], isFirstRead: true });

    expect(plan.send).toEqual([]);
    expect(plan.record).toEqual(["card-claimed", "card-onboarding-completed"]);
  });

  it("leaves alone what was reported before", () => {
    const plan = planPayCardMilestoneReports({
      observed,
      reported: ["card-claimed"],
      isFirstRead: false,
    });

    expect(plan.send).toEqual([{ id: "card-onboarding-completed" }]);
    expect(plan.record).toEqual(["card-onboarding-completed"]);
  });
});
