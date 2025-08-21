/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import * as delegate from "./delegate";
import * as send from "./send";
import { getTransactionStatusByTransactionMode } from "./handler";
import * as undelegate from "./undelegate";
import { CardanoAccount, Transaction } from "../types";

jest.mock("./delegate");
jest.mock("./send");
jest.mock("./undelegate");

describe("getTransactionStatusByMode on Cardano", () => {
  const sendMock = send.getSendTransactionStatus as jest.Mock;
  const delegateMock = delegate.getDelegateTransactionStatus as jest.Mock;
  const undelegateMock = undelegate.getUndelegateTransactionStatus as jest.Mock;

  describe("should redirect to the correct mode handler", () => {
    test.each([
      ["send", sendMock],
      ["delegate", delegateMock],
      ["undelegate", undelegateMock],
    ])("for %s", async (mode, mock) => {
      const account = {} as unknown as CardanoAccount;
      const transaction = { mode: mode } as unknown as Transaction;

      await getTransactionStatusByTransactionMode(account, transaction);

      expect(mock).toHaveBeenCalledWith(account, transaction);
    });
  });
});
