import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getTransactionStatus from "./getTransactionStatus";

const stubIsNewAccount = jest.fn();
const stubIsElectionClosed = jest.fn();
const stubIsControllerAddress = jest.fn();
const stubVerifyValidatorAddresses = jest.fn();

jest.mock("../network", () => {
  return {
    isNewAccount: () => stubIsNewAccount(),
    isElectionClosed: () => stubIsElectionClosed(),
    isControllerAddress: () => stubIsControllerAddress(),
    verifyValidatorAddresses: () => stubVerifyValidatorAddresses(),
  };
});
const apiStubs = [
  stubIsNewAccount,
  stubIsElectionClosed,
  stubIsControllerAddress,
  stubVerifyValidatorAddresses,
];

describe("getTransactionStatus", () => {
  beforeEach(() => {
    apiStubs.forEach(s => s.mockClear);
  });

  describe('in "send" mode', () => {
    it("only calls isNewAccount api", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ mode: "send" });

      await getTransactionStatus(account, transaction);

      expect(stubIsNewAccount).toHaveBeenCalledTimes(1);
      expect(stubIsElectionClosed).not.toHaveBeenCalled();
      expect(stubIsControllerAddress).not.toHaveBeenCalled();
      expect(stubVerifyValidatorAddresses).not.toHaveBeenCalled();
    });
  });
});
