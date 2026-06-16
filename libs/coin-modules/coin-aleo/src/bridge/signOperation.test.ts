import BigNumber from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { sdkClient } from "../network/sdk";
import { craftTransaction } from "../logic";
import {
  getMockedAccount,
  mockAleoResources,
  mockUnspentRecord1,
  mockUnspentRecord2,
} from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedPreparedRequestResponse } from "../__tests__/fixtures/sdk.fixture";
import { getMockedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { toHex } from "../logic/utils";
import type { AleoSigner } from "../types";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildSignOperation } from "./signOperation";

jest.mock("../network/sdk");
jest.mock("../logic");
jest.mock("./buildOptimisticOperation");
jest.mock("../config");

const mockAleoConfig = jest.mocked(aleoCoinConfig);
const mockedCreateAuthorization = jest.mocked(sdkClient.createAuthorization);
const mockedCraftTransaction = jest.mocked(craftTransaction);
const mockedBuildOptimisticOperation = jest.mocked(buildOptimisticOperation);

function createMockSigner(): jest.Mocked<AleoSigner> {
  return {
    getAppConfig: jest.fn(),
    getAddress: jest.fn(),
    getViewKey: jest.fn(),
    getTvk: jest.fn().mockResolvedValue({ tvk: new Uint8Array([0xaa]) }),
    signRootIntent: jest.fn().mockResolvedValue({ signature: "root-signature" }),
    signFeeIntent: jest.fn().mockResolvedValue({ signature: "fee-signature" }),
    signNestedCall: jest.fn().mockResolvedValue({ signature: "nested-signature" }),
  };
}

function createMockSignerContext(signer: AleoSigner): SignerContext<AleoSigner> {
  return jest.fn().mockImplementation((_deviceId, fn) => fn(signer));
}

describe("buildSignOperation", () => {
  const mockConfig = { ...getMockedConfig("testnet"), isFeeSponsored: false };
  const mockRequest = getMockedPreparedRequestResponse();
  const mockAccount = getMockedAccount({
    aleoResources: {
      ...mockAleoResources,
      unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
    },
  });
  const mockTransaction = getMockedTransaction({ fees: new BigNumber(1000) });
  const mockOperation = getMockedOperation();
  const mockSigner = createMockSigner();
  const mockSignerContext = createMockSignerContext(mockSigner);
  const mockSignOperation = buildSignOperation(mockSignerContext);
  const mockMultiRecordTransaction = getMockedTransaction({
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: {
      amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
      feeRecordCommitment: mockUnspentRecord2.commitment,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCraftTransaction.mockResolvedValue({ transaction: toHex(mockRequest) });
    mockedCreateAuthorization
      .mockResolvedValueOnce({ authorization: "tx-auth", execution_id: "exec-id" })
      .mockResolvedValueOnce({ authorization: "fee-auth", execution_id: "exec-id-2" });
    mockedBuildOptimisticOperation.mockReturnValue(mockOperation);
    mockAleoConfig.getCoinConfig.mockReturnValue(mockConfig);
  });

  it("should emit events in order", async () => {
    const events = await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
  });

  it("should emit a signed event with the optimistic operation and the encoded signed transaction", async () => {
    const events = await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    const signedEvent = events.find(e => e.type === "signed");
    const parsedSignature = JSON.parse(
      Buffer.from(signedEvent?.signedOperation.signature ?? "", "hex").toString(),
    );

    expect(signedEvent?.type).toBe("signed");
    expect(signedEvent?.signedOperation.operation).toBe(mockOperation);
    expect(parsedSignature).toEqual({
      authorization: "tx-auth",
      feeAuthorization: "fee-auth",
    });
  });

  it("should call craftTransaction twice - once for the main tx and once for the fee", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCraftTransaction).toHaveBeenCalledTimes(2);
  });

  it("should call sdkClient.createAuthorization twice - once for the main tx and once for the fee", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(2);
  });

  it("should call signer.signRootIntent with the account derivation path", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signRootIntent).toHaveBeenCalledTimes(1);
    expect(mockSigner.signRootIntent).toHaveBeenCalledWith(
      mockAccount.freshAddressPath,
      expect.any(Buffer),
    );
  });

  it("should call signer.signFeeIntent once for non-sponsored transactions", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signFeeIntent).toHaveBeenCalledTimes(1);
    expect(mockSigner.signFeeIntent).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("should not call signer.signFeeIntent when fee is sponsored", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signFeeIntent).not.toHaveBeenCalled();
  });

  it("should use fee_private function name when transaction is private", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: privateTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCraftTransaction).toHaveBeenCalledTimes(2);
    expect(mockedCraftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        feeConfiguration: expect.objectContaining({ function_name: "fee_private" }),
      }),
    );
  });

  it("should skip fee authorization and set feeAuthorization to null when isFeeSponsored is true", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });

    const events = await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    const signedEvent = events.find(e => e.type === "signed");
    const parsedSignature = JSON.parse(
      Buffer.from(signedEvent?.signedOperation.signature ?? "", "hex").toString(),
    );

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(1);
    expect(parsedSignature.feeAuthorization).toBeNull();
  });

  it("should emit device-signature-granted after signFeeIntent when fee is not sponsored", async () => {
    const callOrder: string[] = [];

    mockSigner.signFeeIntent.mockImplementationOnce(async () => {
      callOrder.push("signFeeIntent");
      return { signature: "fee-signature" };
    });

    await new Promise<void>((resolve, reject) => {
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).subscribe({
        next: event => {
          if (event.type === "device-signature-granted") callOrder.push("device-signature-granted");
        },
        error: reject,
        complete: resolve,
      });
    });

    expect(callOrder.indexOf("signFeeIntent")).toBeLessThan(
      callOrder.indexOf("device-signature-granted"),
    );
  });

  it("should emit device-signature-granted before createAuthorization when fee is sponsored", async () => {
    const callOrder: string[] = [];

    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });
    mockedCreateAuthorization.mockReset();
    mockedCreateAuthorization.mockImplementationOnce(async () => {
      callOrder.push("createAuthorization");
      return { authorization: "tx-auth", execution_id: "exec-id" };
    });

    await new Promise<void>((resolve, reject) => {
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).subscribe({
        next: event => {
          if (event.type === "device-signature-granted") callOrder.push("device-signature-granted");
        },
        error: reject,
        complete: resolve,
      });
    });

    expect(callOrder.indexOf("device-signature-granted")).toBeLessThan(
      callOrder.indexOf("createAuthorization"),
    );
  });

  it("should sign nested calls before emitting device-signature-granted", async () => {
    const callOrder: string[] = [];
    const requestWithNested = getMockedPreparedRequestResponse({
      nested_calls: [getMockedPreparedRequestResponse({ is_root: false, tlv: "deadbeef" })],
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, recordPickingStrategy: "auto" });
    mockedCraftTransaction.mockResolvedValueOnce({ transaction: toHex(requestWithNested) });
    mockSigner.signNestedCall.mockImplementationOnce(async () => {
      callOrder.push("signNestedCall");
      return { signature: "nested-signature" };
    });

    await new Promise<void>((resolve, reject) => {
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).subscribe({
        next: event => {
          if (event.type === "device-signature-granted") callOrder.push("device-signature-granted");
        },
        error: reject,
        complete: resolve,
      });
    });

    expect(mockSigner.signNestedCall).toHaveBeenCalledTimes(1);
    expect(callOrder.indexOf("signNestedCall")).toBeLessThan(
      callOrder.indexOf("device-signature-granted"),
    );
  });

  it("should include nested call signatures in createAuthorization call", async () => {
    const requestWithNested = getMockedPreparedRequestResponse({
      nested_calls: [
        getMockedPreparedRequestResponse({ is_root: false, tlv: "aabb" }),
        getMockedPreparedRequestResponse({ is_root: false, tlv: "ccdd" }),
      ],
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, recordPickingStrategy: "auto" });
    mockedCraftTransaction.mockResolvedValueOnce({ transaction: toHex(requestWithNested) });
    mockSigner.signNestedCall
      .mockResolvedValueOnce({ signature: "nested-sig-1" })
      .mockResolvedValueOnce({ signature: "nested-sig-2" });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCreateAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        signatures: ["root-signature", "nested-sig-1", "nested-sig-2"],
      }),
    );
  });

  it("should sign deeply nested calls respecting the order", async () => {
    const requestWithNested = getMockedPreparedRequestResponse({
      nested_calls: [
        getMockedPreparedRequestResponse({
          is_root: false,
          tlv: "aabb",
          nested_calls: [getMockedPreparedRequestResponse({ is_root: false, tlv: "ccdd" })],
        }),
      ],
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, recordPickingStrategy: "auto" });
    mockedCraftTransaction.mockResolvedValueOnce({ transaction: toHex(requestWithNested) });
    mockSigner.signNestedCall
      .mockResolvedValueOnce({ signature: "nested-sig-1" })
      .mockResolvedValueOnce({ signature: "nested-sig-2" });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signNestedCall).toHaveBeenCalledTimes(2);
    expect(mockSigner.signNestedCall).toHaveBeenNthCalledWith(1, Buffer.from("aabb", "hex"));
    expect(mockSigner.signNestedCall).toHaveBeenNthCalledWith(2, Buffer.from("ccdd", "hex"));
    expect(mockedCreateAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        signatures: ["root-signature", "nested-sig-1", "nested-sig-2"],
      }),
    );
  });

  it("should not call signNestedCall when there are no nested calls", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signNestedCall).not.toHaveBeenCalled();
  });

  it("should not call signNestedCall when using manual strategy even if response has nested calls", async () => {
    const requestWithNested = getMockedPreparedRequestResponse({
      nested_calls: [getMockedPreparedRequestResponse({ is_root: false, tlv: "deadbeef" })],
    });

    mockedCraftTransaction.mockResolvedValueOnce({ transaction: toHex(requestWithNested) });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.signNestedCall).not.toHaveBeenCalled();
  });

  it("should use array signatures for both main tx and fee for auto strategy", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, recordPickingStrategy: "auto" });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(2);
    expect(mockedCreateAuthorization).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ signatures: ["root-signature"] }),
    );
    expect(mockedCreateAuthorization).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ signatures: ["fee-signature"] }),
    );
  });

  it("should propagate signer errors to the observable", async () => {
    const signer = createMockSigner();
    signer.signRootIntent.mockRejectedValue(new Error("device disconnected"));
    const invalidSignOperation = buildSignOperation(createMockSignerContext(signer));

    await expect(
      firstValueFrom(
        invalidSignOperation({
          account: mockAccount,
          transaction: mockTransaction,
          deviceId: "test-device",
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("device disconnected");
  });

  it("should report device-streaming progress as a 0-1 fraction when precomputing TVKs", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    const events = await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: privateTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    const streamingEvents = events
      .filter(event => event.type === "device-streaming")
      .map(event => ({
        progress: event.progress,
        index: event.index,
        total: event.total,
      }));

    expect(streamingEvents.length).toBeGreaterThan(0);
    expect(streamingEvents.at(0)).toEqual({ progress: 0.01, index: 0, total: 3 });
    expect(streamingEvents.at(-1)).toEqual({ progress: 1, index: 2, total: 3 });
    expect(streamingEvents.every(event => event.progress >= 0 && event.progress <= 1)).toBe(true);
    expect(mockSigner.getTvk).toHaveBeenCalledTimes(3);
    expect(mockSigner.getTvk).toHaveBeenNthCalledWith(1, mockAccount.freshAddressPath);
    expect(mockSigner.getTvk).toHaveBeenNthCalledWith(2, mockAccount.freshAddressPath, 1);
    expect(mockSigner.getTvk).toHaveBeenNthCalledWith(3, mockAccount.freshAddressPath, 2);
  });

  it("should pass precomputed tvks to craftTransaction for multi-record private txs", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: privateTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCraftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        tvks: ["aa", "aa", "aa"],
      }),
    );
  });

  it("should not precompute tvks for single-record private txs", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: privateTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.getTvk).not.toHaveBeenCalled();
    expect(mockedCraftTransaction).toHaveBeenCalledWith(
      expect.not.objectContaining({
        tvks: expect.anything(),
      }),
    );
  });

  it("should not precompute tvks for public txs", async () => {
    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockSigner.getTvk).not.toHaveBeenCalled();
  });

  it("should propagate getTvk errors to the observable", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });
    const signer = createMockSigner();
    signer.getTvk.mockRejectedValue(new Error("tvk precompute failed"));
    const invalidSignOperation = buildSignOperation(createMockSignerContext(signer));

    await expect(
      firstValueFrom(
        invalidSignOperation({
          account: mockAccount,
          transaction: privateTransaction,
          deviceId: "test-device",
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("tvk precompute failed");
  });

  it("should propagate an error when account id has no viewKey", async () => {
    const accountWithoutViewKey = getMockedAccount({ id: "js:2:aleo:aleo1test:" });

    await expect(
      firstValueFrom(
        mockSignOperation({
          account: accountWithoutViewKey,
          transaction: mockTransaction,
          deviceId: "test-device",
        }).pipe(toArray()),
      ),
    ).rejects.toThrow(`aleo: view key is missing in ${accountWithoutViewKey.freshAddress} account`);
  });

  it("should stop TVK fetching when subscription is cancelled after root TVK", async () => {
    let streamingEventCount = 0;
    const sub = mockSignOperation({
      account: mockAccount,
      transaction: mockMultiRecordTransaction,
      deviceId: "test-device",
    }).subscribe({
      next: event => {
        if (event.type === "device-streaming") {
          streamingEventCount++;
          if (streamingEventCount === 2) sub.unsubscribe();
        }
      },
    });

    await new Promise<void>(resolve => setImmediate(resolve));

    expect(mockSigner.getTvk).toHaveBeenCalledTimes(1);
    expect(mockSigner.signRootIntent).not.toHaveBeenCalled();
  });

  it("should not start signing when subscription is cancelled after all TVKs are fetched", async () => {
    const sub = mockSignOperation({
      account: mockAccount,
      transaction: mockMultiRecordTransaction,
      deviceId: "test-device",
    }).subscribe({
      next: event => {
        if (event.type === "device-streaming" && event.progress === 1) {
          sub.unsubscribe();
        }
      },
    });

    await new Promise<void>(resolve => setImmediate(resolve));

    expect(mockSigner.getTvk).toHaveBeenCalledTimes(3);
    expect(mockSigner.signRootIntent).not.toHaveBeenCalled();
  });
});
