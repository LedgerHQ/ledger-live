import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import createSendSteps from "./createSendSteps";
import type { StepProps } from "~/renderer/modals/Send/types";

jest.mock("@ledgerhq/live-common/families/aleo/utils", () => ({
  isPrivateTransaction: jest.fn(),
}));

jest.mock("~/renderer/modals/Send/steps/StepAmount", () => ({
  __esModule: true,
  default: () => null,
  StepAmountFooter: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/StepSummary", () => ({
  __esModule: true,
  default: () => null,
  StepSummaryFooter: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/StepConnectDevice", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/StepConfirmation", () => ({
  __esModule: true,
  default: () => null,
  StepConfirmationFooter: () => null,
}));
jest.mock("./modals/send/steps/StepRecipient", () => ({ __esModule: true, default: () => null }));
jest.mock("./modals/send/steps/StepRecipientFooter", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("./modals/send/steps/StepMandatoryPrivateSync", () => ({
  __esModule: true,
  default: () => null,
}));

describe("createSendSteps", () => {
  const steps = createSendSteps();

  it("should return all expected step ids in correct order", () => {
    const ids = steps.map(s => s.id);

    expect(ids).toEqual([
      "recipient",
      "private-sync",
      "amount",
      "summary",
      "device",
      "confirmation",
    ]);
  });

  it("should have null onBack for recipient step", () => {
    const step = steps.find(s => s.id === "recipient");

    expect(step?.onBack).toBeNull();
  });

  it("should have null onBack for confirmation step", () => {
    const step = steps.find(s => s.id === "confirmation");

    expect(step?.onBack).toBeNull();
  });

  it("should mark private-sync as excludeFromBreadcrumb", () => {
    const privateSync = steps.find(s => s.id === "private-sync");

    expect(privateSync?.excludeFromBreadcrumb).toBe(true);
  });

  it("should navigate to the correct step when going back", () => {
    const cases: { stepId: string; isPrivate?: boolean; expectedTarget: string }[] = [
      { stepId: "private-sync", expectedTarget: "recipient" },
      { stepId: "amount", isPrivate: true, expectedTarget: "recipient" },
      { stepId: "amount", isPrivate: false, expectedTarget: "recipient" },
      { stepId: "summary", expectedTarget: "amount" },
      { stepId: "device", expectedTarget: "summary" },
    ];

    for (const { stepId, isPrivate, expectedTarget } of cases) {
      if (isPrivate !== undefined) jest.mocked(isPrivateTransaction).mockReturnValue(isPrivate);
      const step = steps.find(s => s.id === stepId);
      const transitionTo = jest.fn();
      const updateTransaction = jest.fn();
      const stepProps = {
        transitionTo,
        updateTransaction,
        transaction: { family: "aleo" },
      } as unknown as StepProps;
      step?.onBack?.(stepProps);
      expect(transitionTo).toHaveBeenCalledWith(expectedTarget);
    }
  });
});
