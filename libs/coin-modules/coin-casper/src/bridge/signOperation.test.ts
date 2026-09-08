import { toArray, firstValueFrom } from "rxjs";
import { buildSignOperation } from "./signOperation";
import { craftTransaction } from "../logic/craftTransaction";
import { getAddress } from "../logic/validateAddress";
import { tagSignature } from "../signer/deviceResponse";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { createMockAccount, createMockTransaction } from "../__tests__/fixtures";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

jest.mock("../logic/craftTransaction", () => ({
  craftTransaction: jest.fn(),
}));

jest.mock("../logic/validateAddress", () => ({
  getAddress: jest.fn(),
}));

jest.mock("../signer/deviceResponse", () => ({
  tagSignature: jest.fn(),
}));

jest.mock("./buildOptimisticOperation", () => ({
  buildOptimisticOperation: jest.fn(),
}));

const mockTxBytes = new Uint8Array([1, 2, 3]);
const mockTxHash = "abcdef1234567890";
const mockTxJSON = { hash: mockTxHash };
const mockCasperTx = {
  toBytes: jest.fn().mockReturnValue(mockTxBytes),
  hash: { getHash: jest.fn().mockReturnValue({ toHex: jest.fn().mockReturnValue(mockTxHash) }) },
  toJSON: jest.fn().mockReturnValue(mockTxJSON),
};

jest.mock("casper-js-sdk", () => ({
  Transaction: {
    fromJSON: jest.fn(),
  },
}));

import { Transaction as CasperSdkTransaction } from "casper-js-sdk";

describe("buildSignOperation", () => {
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction();
  const mockDeviceId = "mock-device-id";
  const mockAddress = "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";
  const mockDerivationPath = "44'/506'/0'/0/1";
  const mockSignatureRS = "signatureRS";
  const mockTaggedSignature = "02" + "a".repeat(128);
  const mockOperation = { id: "op-id", type: "OUT" };

  const mockSignerContext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (getAddress as jest.Mock).mockReturnValue({
      address: mockAddress,
      derivationPath: mockDerivationPath,
    });

    (craftTransaction as jest.Mock).mockResolvedValue({
      transaction: JSON.stringify(mockTxJSON),
    });

    (CasperSdkTransaction.fromJSON as jest.Mock).mockReturnValue(mockCasperTx);

    mockSignerContext.mockImplementation(async (_deviceId, cb) => {
      return cb({ sign: jest.fn().mockResolvedValue({ signatureRS: mockSignatureRS }) });
    });

    (tagSignature as jest.Mock).mockReturnValue(mockTaggedSignature);
    (buildOptimisticOperation as jest.Mock).mockReturnValue(mockOperation);
  });

  it("emits device-signature-requested, device-signature-granted, and signed events", async () => {
    const signOp = buildSignOperation(mockSignerContext);
    const events = await firstValueFrom(
      signOp({ account: mockAccount, transaction: mockTransaction, deviceId: mockDeviceId }).pipe(
        toArray(),
      ),
    );

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "device-signature-requested" });
    expect(events[1]).toEqual({ type: "device-signature-granted" });
    expect(events[2]).toMatchObject({
      type: "signed",
      signedOperation: {
        operation: mockOperation,
        signature: mockTaggedSignature,
        rawData: { tx: JSON.stringify(mockTxJSON) },
      },
    });
  });

  it("calls craftTransaction with transferId memo when transferId is present", async () => {
    const txWithTransferId = createMockTransaction({ transferId: "123456" });
    const signOp = buildSignOperation(mockSignerContext);

    await firstValueFrom(
      signOp({
        account: mockAccount,
        transaction: txWithTransferId,
        deviceId: mockDeviceId,
      }).pipe(toArray()),
    );

    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        memo: { type: "string", kind: "transferId", value: "123456" },
      }),
      expect.anything(),
    );
  });

  it("calls craftTransaction without memo when transferId is undefined", async () => {
    const txWithoutTransferId = createMockTransaction();
    const signOp = buildSignOperation(mockSignerContext);

    await firstValueFrom(
      signOp({
        account: mockAccount,
        transaction: txWithoutTransferId,
        deviceId: mockDeviceId,
      }).pipe(toArray()),
    );

    expect(craftTransaction).toHaveBeenCalledWith(
      expect.not.objectContaining({ memo: expect.anything() }),
      expect.anything(),
    );
  });

  it("does not override default fees when transaction fees is null", async () => {
    const txWithoutFees = { ...mockTransaction, fees: null };
    const signOp = buildSignOperation(mockSignerContext);

    await firstValueFrom(
      signOp({ account: mockAccount, transaction: txWithoutFees, deviceId: mockDeviceId }).pipe(
        toArray(),
      ),
    );

    expect(craftTransaction).toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it("emits an error when signerContext rejects", async () => {
    const error = new Error("signer failed");
    mockSignerContext.mockRejectedValue(error);

    const signOp = buildSignOperation(mockSignerContext);

    await expect(
      firstValueFrom(
        signOp({
          account: mockAccount,
          transaction: mockTransaction,
          deviceId: mockDeviceId,
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("signer failed");
  });
});
