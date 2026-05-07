import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";
import createSendSteps from "./createSendSteps";
import { getAleoCurrencyConfig } from "./shared/utils";
import { mockAleoCoinConfig } from "./__mocks__/config.mock";
import { ALEO_ACCOUNT_1 } from "./__mocks__/account.mock";
import type { StepProps } from "~/renderer/modals/Send/types";

jest.mock("@ledgerhq/live-common/families/aleo/utils", () => ({
  isPrivateTransaction: jest.fn(),
}));

jest.mock("./shared/utils", () => ({
  getAleoCurrencyConfig: jest.fn(),
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

jest.mock("~/renderer/modals/Send/steps/StepAmount", () => ({
  __esModule: true,
  default: () => null,
  StepAmountFooter: () => null,
}));
jest.mock("./modals/send/steps/StepAmount", () => ({ __esModule: true, default: () => null }));
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

  beforeEach(() => {
    jest.clearAllMocks();
    // default: config returns undefined → isManualStrategy = true (manual behaviour)
    mockGetAleoCurrencyConfig.mockReturnValue(undefined);
  });
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
      properties: { amountRecordCommitments: ["some-commitment"], feeRecordCommitment: "some-fee" },
    };
    const result = updater(privateTransaction);
    expect(result.properties).toEqual({ amountRecordCommitments: [], feeRecordCommitment: null });
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

  it("should navigate to record-picker when going back from amount on a private tx with manual strategy", () => {
    jest.mocked(isPrivateTransaction).mockReturnValue(true);
    mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);

    const step = steps.find(s => s.id === "amount");
    const transitionTo = jest.fn();
    const stepProps = {
      transitionTo,
      updateTransaction: jest.fn(),
      transaction: { family: "aleo" },
      account: ALEO_ACCOUNT_1,
      parentAccount: null,
    } as unknown as StepProps;
    step?.onBack?.(stepProps);

    expect(transitionTo).toHaveBeenCalledWith("record-picker");
  });

  it("should navigate to recipient when going back from amount on a private tx with auto strategy", () => {
    jest.mocked(isPrivateTransaction).mockReturnValue(true);
    const autoConfig: AleoCoinConfig = { ...mockAleoCoinConfig, recordPickingStrategy: "auto" };
    mockGetAleoCurrencyConfig.mockReturnValue(autoConfig);

    const step = steps.find(s => s.id === "amount");
    const transitionTo = jest.fn();
    const stepProps = {
      transitionTo,
      updateTransaction: jest.fn(),
      transaction: { family: "aleo" },
      account: ALEO_ACCOUNT_1,
      parentAccount: null,
    } as unknown as StepProps;
    step?.onBack?.(stepProps);

    expect(transitionTo).toHaveBeenCalledWith("recipient");
  });
});
