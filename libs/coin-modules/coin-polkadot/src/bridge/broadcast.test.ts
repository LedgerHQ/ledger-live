import { createFixtureOperation } from "../types/bridge.fixture";
import { broadcast } from "./broadcast";
import { Account, Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const mockSubmitExtrinsic = jest.fn();

jest.mock("../network", () => {
  return {
    submitExtrinsic: (arg: any) => mockSubmitExtrinsic(arg),
  };
});

const logicBroadcastMock = jest.fn();
jest.mock("../logic", () => {
  return {
    broadcast: (signature: string, currencyId?: string) =>
      logicBroadcastMock(signature, currencyId),
  };
});

const patchOperationWithHashMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/operation", () => {
  return {
    patchOperationWithHash: (operation: Operation, hash: string) =>
      patchOperationWithHashMock(operation, hash),
  };
});

const account = toAccount({
  currency: {
    id: "polkadot",
  },
});

function toAccount(account: unknown): Account {
  if (isAccount(account)) {
    return account;
  }

  throw new Error(`Object is not an Account ${account}`);
}

function isAccount(account: unknown): account is Account {
  return (
    account !== null &&
    account !== undefined &&
    typeof account === "object" &&
    "currency" in account &&
    isCryptoCurrency(account.currency)
  );
}

function isCryptoCurrency(cryptoCurrency: unknown): cryptoCurrency is CryptoCurrency {
  return (
    cryptoCurrency !== null &&
    cryptoCurrency !== undefined &&
    typeof cryptoCurrency === "object" &&
    "id" in cryptoCurrency
  );
}

describe("broadcast", () => {
  it("it should broadcast the signed operation and return an operation with the hash", async () => {
    const hash = "some random hash";
    logicBroadcastMock.mockReturnValueOnce(hash);

    const patchedOperation = createFixtureOperation();
    patchOperationWithHashMock.mockReturnValueOnce(patchedOperation);

    const signature = "some random signature";
    const operation = createFixtureOperation();

    const broadcastedOperation = await broadcast({
      account: account,
      signedOperation: {
        signature,
        operation,
      },
    });

    expect(logicBroadcastMock).toHaveBeenCalledTimes(1);
    expect(logicBroadcastMock.mock.lastCall[0]).toEqual(signature);
    expect(logicBroadcastMock.mock.lastCall[1]).toEqual(account.currency.id);

    expect(patchOperationWithHashMock).toHaveBeenCalledTimes(1);
    expect(patchOperationWithHashMock.mock.lastCall[0]).toEqual(operation);
    expect(patchOperationWithHashMock.mock.lastCall[1]).toEqual(hash);

    expect(broadcastedOperation).toEqual(patchedOperation);
  });
});
