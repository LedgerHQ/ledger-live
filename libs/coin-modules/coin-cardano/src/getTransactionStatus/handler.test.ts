/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import { getTransactionStatusByTransactionMode } from "./handler";
import { CardanoAccount, Transaction } from "../types";
import * as send from "./send";
import * as delegate from "./delegate";
import * as undelegate from "./undelegate";
import * as voteDelegate from "./voteDelegate";

jest.mock("./delegate");
jest.mock("./send");
jest.mock("./undelegate");
jest.mock("./voteDelegate");

describe("getTransactionStatusByMode on Cardano", () => {
  const sendMock = send.getSendTransactionStatus as jest.Mock;
  const delegateMock = delegate.getDelegateTransactionStatus as jest.Mock;
  const undelegateMock = undelegate.getUndelegateTransactionStatus as jest.Mock;
  const voteDelegateMock = voteDelegate.getVoteDelegateTransactionStatus as jest.Mock;

  describe("should redirect to the correct mode handler", () => {
    test.each([
      ["send", sendMock],
      ["delegate", delegateMock],
      ["undelegate", undelegateMock],
      ["voteDelegate", voteDelegateMock],
    ])("for %s", async (mode, mock) => {
      const account = {} as unknown as CardanoAccount;
      const transaction = { mode: mode } as unknown as Transaction;

      await getTransactionStatusByTransactionMode(account, transaction);

      expect(mock).toHaveBeenCalledWith(account, transaction);
    });
  });
});
