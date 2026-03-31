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
    signRootIntent: jest.fn().mockResolvedValue({ signature: "root-signature" }),
    signFeeIntent: jest.fn().mockResolvedValue({ signature: "fee-signature" }),
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

  it("should use fee_private function name when transaction is private", async () => {
    const privateTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitment: mockUnspentRecord1.commitment,
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

  it("should keep fee_private function name for sponsored private transactions", async () => {
    const privateSponsoredTransaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitment: mockUnspentRecord1.commitment,
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });

    await firstValueFrom(
      mockSignOperation({
        account: mockAccount,
        transaction: privateSponsoredTransaction,
        deviceId: "test-device",
      }).pipe(toArray()),
    );

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(1);
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
});
