import createSendSteps from "./createSendSteps";

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
});
