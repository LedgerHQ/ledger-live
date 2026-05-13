import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import {
  hasStartedLedgerRecoverFlowForPostOnboarding,
  shouldShowRecoverPortfolioWidget,
} from "../recoverPortfolioWidgetVisibility";

describe("recoverPortfolioWidgetVisibility", () => {
  describe("hasStartedLedgerRecoverFlowForPostOnboarding (parity with LLM checkCanShow)", () => {
    it.each<
      Readonly<{
        state: LedgerRecoverSubscriptionStateEnum | undefined;
        expected: boolean;
      }>
    >([
      { state: undefined, expected: false },
      { state: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, expected: false },
      { state: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE, expected: true },
    ])("returns $expected when state is $state", ({ state, expected }) => {
      expect(hasStartedLedgerRecoverFlowForPostOnboarding(state)).toBe(expected);
    });
  });

  describe("shouldShowRecoverPortfolioWidget", () => {
    it.each<
      Readonly<{
        state: LedgerRecoverSubscriptionStateEnum | undefined;
        expected: boolean;
      }>
    >([
      { state: undefined, expected: false },
      { state: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, expected: false },
      { state: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION, expected: true },
      { state: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE, expected: false },
    ])("returns $expected when state is $state", ({ state, expected }) => {
      expect(shouldShowRecoverPortfolioWidget(state)).toBe(expected);
    });
  });
});
