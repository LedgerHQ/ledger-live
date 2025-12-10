/* eslint-disable @typescript-eslint/consistent-type-assertions */
import prepareTransferMock from "@ledgerhq/hw-app-canton/tests/fixtures/prepare-transfer.json";
import { craftTransaction } from "../common-logic";
import {
  createMockCantonAccount,
  createMockCantonSigner,
  createMockSignerContext,
  createMockTransaction,
} from "../test/fixtures";
import { buildSignOperation } from "./signOperation";

jest.mock("../common-logic", () => {
  const actual = jest.requireActual("../common-logic");
  return {
    ...actual,
    craftTransaction: jest.fn(),
  };
});

const {
  json: { transaction, metadata },
} = prepareTransferMock;
const mockCraftTransaction = craftTransaction as jest.MockedFunction<typeof craftTransaction>;

describe("buildSignOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCraftTransaction.mockReset();
  });

  const mockAccount = createMockCantonAccount();
  const mockTransaction = createMockTransaction();
  const mockDeviceId = "test-device-id";

  it("should use default expireInSeconds (1 day) when not provided in transaction", async () => {
    // GIVEN
    const mockSigner = new MockCantonSigner();
    const mockSignerContext = jest.fn().mockImplementation(async (deviceId, callback) => {
      return await callback(mockSigner);
    });

    mockCraftTransaction.mockResolvedValue({
      nativeTransaction: {
        // @ts-expect-error fix types
        transaction: prepareTransferMock.transaction,
        metadata: prepareTransferMock.metadata,
      },
      serializedTransaction: "serialized-transaction",
      hash: "mock-hash",
    });

    const signOperation = buildSignOperation(mockSignerContext);
    const transactionWithoutExpiry: Transaction = {
      ...mockTransaction,
      expireInSeconds: undefined,
    };

    // WHEN
    await new Promise((resolve, reject) => {
      signOperation({
        account: mockAccount,
        deviceId: mockDeviceId,
        transaction: transactionWithoutExpiry,
      }).subscribe({
        next: value => {
          if (value.type === "signed") {
            resolve(value);
          }
        },
        error: reject,
      });
    });

    // THEN
    expect(mockCraftTransaction).toHaveBeenCalledWith(
      mockAccount.currency,
      expect.any(Object),
      expect.objectContaining({
        expireInSeconds: 24 * 60 * 60, // Default 1 day
      }),
    );
  });

  it("should use custom expireInSeconds when provided in transaction", async () => {
    // GIVEN
    const mockSigner = new MockCantonSigner();
    const mockSignerContext = jest.fn().mockImplementation(async (deviceId, callback) => {
      return await callback(mockSigner);
    });

    mockCraftTransaction.mockResolvedValue({
      nativeTransaction: {
        // @ts-expect-error fix types
        transaction: prepareTransferMock.transaction,
        metadata: prepareTransferMock.metadata,
      },
      serializedTransaction: "serialized-transaction",
      hash: "mock-hash",
    });

    const signOperation = buildSignOperation(mockSignerContext);
    const customExpireSeconds = 3 * 60 * 60; // 3 hours
    const transactionWithExpiry: Transaction = {
      ...mockTransaction,
      expireInSeconds: customExpireSeconds,
    };

    // WHEN
    await new Promise((resolve, reject) => {
      signOperation({
        account: mockAccount,
        deviceId: mockDeviceId,
        transaction: transactionWithExpiry,
      }).subscribe({
        next: value => {
          if (value.type === "signed") {
            resolve(value);
          }
        },
        error: reject,
      });
    });

    // THEN
    expect(mockCraftTransaction).toHaveBeenCalledWith(
      mockAccount.currency,
      expect.any(Object),
      expect.objectContaining({
        expireInSeconds: customExpireSeconds,
      }),
    );
  });

  it("should handle prepared transaction signing", async () => {
    // GIVEN
    const mockSigner = createMockCantonSigner();
    const mockSignerContext = createMockSignerContext(mockSigner);

    mockCraftTransaction.mockResolvedValue({
      nativeTransaction: {
        json: { transaction, metadata },
        serialized: "serialized-transaction",
        hash: "mock-hash",
        step: { type: "single-step" },
      },
      serializedTransaction: "serialized-transaction",
      hash: "mock-hash",
    });

    const signOperation = buildSignOperation(mockSignerContext);

    // WHEN
    const result = await new Promise((resolve, reject) => {
      signOperation({
        account: mockAccount,
        deviceId: mockDeviceId,
        transaction: mockTransaction,
      }).subscribe({
        next: value => {
          if (value.type === "signed") {
            resolve(value);
          }
        },
        error: reject,
      });
    });

    // THEN
    expect(mockCraftTransaction).toHaveBeenCalled();
    expect(result).toMatchObject({ signedOperation: { signature: expect.any(String) } });
    const signedResult = result as { signedOperation: { signature: string } };
    const parsedSignature = JSON.parse(signedResult.signedOperation.signature);
    expect(parsedSignature).toMatchObject({
      serialized: "serialized-transaction",
      signature: expect.stringMatching(
        new RegExp(`^[0-9a-f]+__PARTY__${mockAccount.freshAddress}$`, "i"),
      ),
    });
  });
});
