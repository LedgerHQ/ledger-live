import aleoSendFlow from "../customSendFlow";
import { ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";

jest.mock("@ledgerhq/live-common/families/aleo/utils", () => ({
  isPrivateTransaction: jest.fn(),
}));

const mockIsPrivateTransaction = jest.mocked(isPrivateTransaction);
const navigate = jest.fn();

describe("Aleo customSendFlow", () => {
  const mockTransaction = { family: "aleo" } as Transaction;

  beforeEach(() => {
    navigate.mockClear();
  });

  describe("buildSendEntrypoint", () => {
    it("returns AleoSendBalanceSelection with isSelfTransfer: false", () => {
      const result = aleoSendFlow.buildSendEntrypoint!({
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
      });

      expect(result.screen).toBe(ScreenName.AleoSendBalanceSelection);
      expect(result.params).toMatchObject({ isSelfTransfer: false, account: ALEO_ACCOUNT_1 });
    });
  });

  describe("navigateToInitialScreen", () => {
    it("navigates to AleoSendBalanceSelection with isSelfTransfer: false by default", () => {
      aleoSendFlow.navigateToInitialScreen!({
        navigation: { navigate } as never,
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
      });

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        ScreenName.AleoSendBalanceSelection,
        expect.objectContaining({ isSelfTransfer: false }),
      );
    });

    it("passes isSelfTransfer: true when extra.isSelfTransfer is true", () => {
      aleoSendFlow.navigateToInitialScreen!({
        navigation: { navigate } as never,
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
        extra: { isSelfTransfer: true },
      });

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(
        ScreenName.AleoSendBalanceSelection,
        expect.objectContaining({ isSelfTransfer: true }),
      );
    });
  });

  describe("navigateAfterRecipient", () => {
    it("navigates to AleoMandatoryPrivateSync for private transactions and returns true", () => {
      mockIsPrivateTransaction.mockReturnValue(true);

      const result = aleoSendFlow.navigateAfterRecipient!({
        navigation: { navigate } as never,
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
        transaction: mockTransaction,
      });

      expect(result).toBe(true);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(ScreenName.AleoMandatoryPrivateSync, {
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
        transaction: mockTransaction,
      });
    });

    it("returns false for non-private aleo transactions", () => {
      mockIsPrivateTransaction.mockReturnValue(false);

      const result = aleoSendFlow.navigateAfterRecipient!({
        navigation: { navigate } as never,
        account: ALEO_ACCOUNT_1,
        parentAccount: undefined,
        transaction: mockTransaction,
      });

      expect(result).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
