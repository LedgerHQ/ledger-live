/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import * as delegate from "./getDelegateTransactionStatus";
import * as send from "./getSendTransactionStatus";
import { getTransactionStatusByTransactionMode } from "./getTransactionStatusByMode";
import * as undelegate from "./getUndelegateTransactionStatus";
import { CardanoAccount, Transaction } from "./types";

jest.mock("./getDelegateTransactionStatus");
jest.mock("./getSendTransactionStatus");
jest.mock("./getUndelegateTransactionStatus");

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
