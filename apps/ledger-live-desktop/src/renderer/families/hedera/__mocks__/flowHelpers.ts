import BigNumber from "bignumber.js";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { screen, userEvent, waitFor } from "tests/testSetup";
import { initSendSubjects, subjectRefs, getTransactionStatusSpy } from "./bridge.mock";

export const DEFAULT_TX_STATUS = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(100_000),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(100_000),
};

export function createModalsContainer(): void {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);
}

export async function setupHederaModalTest(statusOverride = DEFAULT_TX_STATUS): Promise<void> {
  mockDomMeasurements();
  await importLLDCoinFamily("hedera");
  initSendSubjects();
  getTransactionStatusSpy.mockResolvedValue(statusOverride);
}

export function cleanupHederaModalTest(): void {
  subjectRefs.sync.complete();
  subjectRefs.sign.complete();
  document.getElementById("modals")?.remove();
}

export async function clickContinueWhenEnabled(): Promise<void> {
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled());
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
}
