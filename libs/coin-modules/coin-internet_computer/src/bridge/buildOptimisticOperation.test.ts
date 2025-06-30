import { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { buildOptimisticSendOperation } from "./buildOptimisticOperation";
import { getEmptyAccount, ICP_CURRENCY_MOCK, SAMPLE_ICP_ADDRESS } from "../test/__fixtures__";
import { setup } from "../test/jest.mocks";
import { ICPAccount, Transaction } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";

jest.mock("./bridgeHelpers/addresses");

describe("buildOptimisticOperation", () => {
  beforeAll(() => {
    setup();
  });

  const mockedGetAddress = getAddress as jest.Mock;

  beforeEach(() => {
    mockedGetAddress.mockReturnValue({ address: SAMPLE_ICP_ADDRESS });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const account: ICPAccount = {
    ...getEmptyAccount(ICP_CURRENCY_MOCK),
    id: "sample-account-id",
  };

  it("should build an optimistic send operation for a 'send' transaction", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber(100000000), // 1 ICP
      recipient: "recipient-address",
      fees: new BigNumber(10000),
      memo: "test memo",
    };
    const hash = "test-hash";
    const operationType: OperationType = "OUT";

    const operation = await buildOptimisticSendOperation(account, transaction, hash, operationType);

    expect(operation.type).toBe("OUT");
    expect(operation.value).toEqual(transaction.amount.plus(transaction.fees));
    expect(operation.fee).toEqual(transaction.fees);
    expect(operation.senders).toEqual([SAMPLE_ICP_ADDRESS]);
    expect(operation.recipients).toEqual([transaction.recipient]);
    expect(operation.extra.memo).toBe(transaction.memo);
    expect(operation.extra.methodName).toBe("send");
    expect(operation.hash).toBe(hash);
    expect(operation.id).toBe(`sample-account-id-${hash}-OUT`);
  });

  it("should build an optimistic operation for 'increase_stake'", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "increase_stake",
      amount: new BigNumber(500000000), // 5 ICP
      recipient: "neuron-address",
      fees: new BigNumber(10000),
      memo: "stake memo",
    };
    const hash = "stake-hash";
    const operationType: OperationType = "OUT";

    const operation = await buildOptimisticSendOperation(account, transaction, hash, operationType);

    expect(operation.type).toBe("OUT");
    expect(operation.extra.methodName).toBe("increase_stake");
  });

  it("should build an optimistic operation for 'create_neuron'", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "create_neuron",
      amount: new BigNumber(1000000000), // 10 ICP
      recipient: "neuron-address",
      fees: new BigNumber(10000),
      memo: "create neuron memo",
    };
    const hash = "create-neuron-hash";
    const operationType: OperationType = "OUT";

    const operation = await buildOptimisticSendOperation(account, transaction, hash, operationType);

    expect(operation.type).toBe("OUT");
    expect(operation.extra.methodName).toBe("create_neuron");
  });

  it("should set operation type to 'NONE' for unsupported transaction types", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "unsupported_type" as "send", // To match Transaction type
      amount: new BigNumber(100000),
      recipient: "some-recipient",
      fees: new BigNumber(10000),
      memo: "unsupported memo",
    };
    const hash = "unsupported-hash";
    const operationType: OperationType = "OUT";

    const operation = await buildOptimisticSendOperation(account, transaction, hash, operationType);

    expect(operation.type).toBe("NONE");
    expect(operation.extra.methodName).toBe("unsupported_type");
    expect(operation.id).toBe(`sample-account-id-${hash}-NONE`);
  });

  it("should use default hash and operationType if not provided", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber(100000000),
      recipient: "recipient-address",
      fees: new BigNumber(10000),
      memo: "test memo",
    };

    const operation = await buildOptimisticSendOperation(account, transaction);

    expect(operation.hash).toBe("");
    expect(operation.type).toBe("OUT");
    expect(operation.id).toBe(`sample-account-id--OUT`);
  });
});
