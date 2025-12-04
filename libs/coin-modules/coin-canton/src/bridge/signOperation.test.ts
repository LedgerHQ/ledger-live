/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { craftTransaction } from "../common-logic";
import {
  createMockCantonAccount,
  createMockCantonSigner,
  createMockSignerContext,
  createMockTransaction,
} from "../test/fixtures";
import prepareTransferMock from "../test/prepare-transfer.json";
import { buildSignOperation } from "./signOperation";

jest.mock("../common-logic", () => {
  const actual = jest.requireActual("../common-logic");
  return {
    ...actual,
    craftTransaction: jest.fn(),
  };
});

const mockCraftTransaction = craftTransaction as jest.MockedFunction<typeof craftTransaction>;

describe("buildSignOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCraftTransaction.mockReset();
  });

  const mockAccount = createMockCantonAccount();
  const mockTransaction = createMockTransaction();
  const mockDeviceId = "test-device-id";

  it("should handle prepared transaction signing", async () => {
    // GIVEN
    const mockSigner = createMockCantonSigner();
    const mockSignerContext = createMockSignerContext(mockSigner);

    mockCraftTransaction.mockResolvedValue({
      nativeTransaction: {
        json: {
          transaction: prepareTransferMock.transaction,
          metadata: prepareTransferMock.metadata,
        },
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
    expect(result).toMatchObject({
      signedOperation: {
        signature: expect.any(String),
      },
    });

    const signedResult = result as { signedOperation: { signature: string } };
    const parsedSignature = JSON.parse(signedResult.signedOperation.signature);
    expect(parsedSignature).toMatchObject({
      serialized: "serialized-transaction",
      signature: expect.stringMatching(/^[0-9a-f]+__PARTY__test_address$/i),
    });
  });
});
