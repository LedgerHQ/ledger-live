import { createMockContext } from "../fixtures/config";
import { CardanoAccount, Transaction } from "../types";
import * as delegate from "./delegate";
import { getTransactionStatusByTransactionMode } from "./handler";
import * as send from "./send";
import * as undelegate from "./undelegate";

jest.mock("./delegate");
jest.mock("./send");
jest.mock("./undelegate");

describe("getTransactionStatusByMode on Cardano", () => {
  const sendMock = send.getSendTransactionStatus as jest.Mock;
  const delegateMock = delegate.getDelegateTransactionStatus as jest.Mock;
  const undelegateMock = undelegate.getUndelegateTransactionStatus as jest.Mock;

  describe("should redirect to the correct mode handler", () => {
    const account = {} as unknown as CardanoAccount;
    const context = createMockContext();

    it("for send, with the context", async () => {
      const transaction = { mode: "send" } as unknown as Transaction;

      await getTransactionStatusByTransactionMode(context, account, transaction);

      expect(sendMock).toHaveBeenCalledWith(context, account, transaction);
    });

    test.each([
      ["delegate", delegateMock],
      ["undelegate", undelegateMock],
    ])("for %s", async (mode, mock) => {
      const transaction = { mode: mode } as unknown as Transaction;

      await getTransactionStatusByTransactionMode(context, account, transaction);

      expect(mock).toHaveBeenCalledWith(account, transaction);
    });
  });
});
