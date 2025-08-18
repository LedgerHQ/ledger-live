import BigNumber from "bignumber.js";
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

    it("[Bug Polkadot] should have no amount error when user have a valid spendable balance", async () => {
      const account = createFixtureAccount({
        spendableBalance: new BigNumber(6705569396),
        balance: new BigNumber(16705569396),
      });
      const transaction = createFixtureTransaction({
        mode: "send",
        fees: new BigNumber(158612606),
        useAllAmount: false,
        amount: new BigNumber(10000000),
      });

      const status = await getTransactionStatus(account, transaction);
      expect(status.errors.amount).toBeUndefined();
    });
  });
});
