import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { handleOnboardingProgress } from "../onboarding";
import { createMockAccount } from "../../__tests__/testUtils";

describe("onboarding utils", () => {
  describe("handleOnboardingProgress", () => {
    it("returns state update for SIGN status", () => {
      const data = {
        status: AccountOnboardStatus.SIGN,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.SIGN,
      });
    });

    it("returns state update for SUBMIT status", () => {
      const data = {
        status: AccountOnboardStatus.SUBMIT,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.SUBMIT,
      });
    });

    it("returns state update with completed account", () => {
      const completedAccount = createMockAccount({ id: "completed" });
      const data = {
        account: completedAccount,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingResult: {
          completedAccount,
        },
        onboardingStatus: AccountOnboardStatus.SUCCESS,
        isProcessing: false,
      });
    });

    it("returns null for unknown progress type", () => {
      const data = {
        someOtherField: "value",
      };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const result = handleOnboardingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns null for PREPARE status", () => {
      const data = {
        status: AccountOnboardStatus.PREPARE,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toBeNull();
    });
  });
});
