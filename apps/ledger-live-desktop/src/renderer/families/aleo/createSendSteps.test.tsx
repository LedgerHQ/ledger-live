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
jest.mock("./modals/send/steps/StepRecordPicker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("./modals/send/steps/StepRecordPickerFooter", () => ({
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
      "record-picker",
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

  it("should mark private-sync and record-picker as excludeFromBreadcrumb", () => {
    const privateSync = steps.find(s => s.id === "private-sync");
    const recordPicker = steps.find(s => s.id === "record-picker");

    expect(privateSync?.excludeFromBreadcrumb).toBe(true);
    expect(recordPicker?.excludeFromBreadcrumb).toBe(true);
  });

  it("should navigate to the correct step when going back", () => {
    const cases: { stepId: string; isPrivate?: boolean; expectedTarget: string }[] = [
      { stepId: "private-sync", expectedTarget: "recipient" },
      { stepId: "record-picker", expectedTarget: "recipient" },
      { stepId: "amount", isPrivate: true, expectedTarget: "record-picker" },
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

  it("should clear selected record when going back from record-picker", () => {
    const step = steps.find(s => s.id === "record-picker");
    const transitionTo = jest.fn();
    const updateTransaction = jest.fn();
    const stepProps = {
      transitionTo,
      updateTransaction,
      transaction: { family: "aleo" },
    } as unknown as StepProps;

    jest.mocked(isPrivateTransaction).mockReturnValue(true);

    step?.onBack?.(stepProps);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const privateTransaction = {
      family: "aleo",
      mode: "transfer_private",
      properties: { amountRecordCommitment: "some-commitment", feeRecordCommitment: "some-fee" },
    };
    const result = updater(privateTransaction);
    expect(result.properties).toEqual({ amountRecordCommitment: null, feeRecordCommitment: null });
  });

  it("should not clear record when going back from record-picker on non-private tx", () => {
    const step = steps.find(s => s.id === "record-picker");
    const transitionTo = jest.fn();
    const updateTransaction = jest.fn();
    const stepProps = {
      transitionTo,
      updateTransaction,
      transaction: { family: "aleo" },
    } as unknown as StepProps;

    jest.mocked(isPrivateTransaction).mockReturnValue(false);

    step?.onBack?.(stepProps);

    const updater = updateTransaction.mock.calls[0][0];
    const publicTransaction = { family: "aleo", mode: "transfer_public" };
    const result = updater(publicTransaction);
    expect(result).toBe(publicTransaction);
  });
});
