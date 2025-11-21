import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { buildTransferInstruction } from "./acceptOffer";
import * as gateway from "../network/gateway";
import * as signTransactionModule from "../common-logic/transaction/sign";
import type { CantonSigner, CantonSignature } from "../types/signer";
import type { PrepareTransferResponse } from "../network/gateway";

jest.mock("../network/gateway");
jest.mock("../common-logic/transaction/sign");

const mockedGateway = gateway as jest.Mocked<typeof gateway>;
const mockedSignTransaction = signTransactionModule as jest.Mocked<typeof signTransactionModule>;

describe("acceptOffer", () => {
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  const mockAccount = {
    id: "test-account-id",
    freshAddressPath: "44'/6767'/0'/0'/0'",
  } as unknown as Account;

  const mockPartyId = "test-party-id";
  const mockContractId = "test-contract-id";
  const mockDeviceId = "test-device-id";

  const mockPreparedTransaction: PrepareTransferResponse = {
    hash: "test-hash",
    json: {
      transaction: {
        version: "2.1",
        roots: ["0"],
        nodes: [
          {
            nodeId: "0",
            v1: {
              create: {
                lfVersion: "2.1",
                contractId: mockContractId,
                packageName: "test-package",
                templateId: {
                  packageId: "test-package-id",
                  moduleName: "TestModule",
                  entityName: "TestEntity",
                },
                argument: {
                  record: {
                    recordId: {
                      packageId: "test-package-id",
                      moduleName: "TestModule",
                      entityName: "TestEntity",
                    },
                    fields: [],
                  },
                },
              },
            },
          },
        ],
      },
      metadata: {
        submitterInfo: {
          actAs: [mockPartyId],
          commandId: "test-command-id",
        },
        synchronizerId: "test-synchronizer-id",
        transactionUuid: "test-transaction-uuid",
        submissionTime: "1234567890",
        inputContracts: [],
      },
    },
    serialized: "serialized-transaction",
  };

  const mockSignature: CantonSignature = {
    signature: "test-signature",
  };

  const mockSigner: CantonSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  } as unknown as CantonSigner;

  const mockSignerContext: SignerContext<CantonSigner> = jest.fn(
    async (deviceId: string, callback: (signer: CantonSigner) => Promise<CantonSignature>) => {
      return callback(mockSigner);
    },
  ) as unknown as SignerContext<CantonSigner>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGateway.prepareTransferInstruction.mockResolvedValue(mockPreparedTransaction);
    mockedSignTransaction.signTransaction.mockResolvedValue(mockSignature);
    mockedGateway.submitTransferInstruction.mockResolvedValue({ update_id: "test-update-id" });
  });

  describe("buildTransferInstruction", () => {
    it("should accept transfer instruction without reason", async () => {
      // GIVEN
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN
      await transferInstruction(
        mockCurrency,
        mockDeviceId,
        mockAccount,
        mockPartyId,
        mockContractId,
        "accept-transfer-instruction",
      );

      // THEN
      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        {
          type: "accept-transfer-instruction",
          contract_id: mockContractId,
        },
      );
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalledWith(
        mockSigner,
        mockAccount.freshAddressPath,
        mockPreparedTransaction,
      );
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        mockPreparedTransaction.serialized,
        mockSignature.signature,
      );
      expect(mockSignerContext).toHaveBeenCalledWith(mockDeviceId, expect.any(Function));
    });

    it("should accept transfer instruction with reason", async () => {
      // GIVEN
      const reason = "test-reason";
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN
      await transferInstruction(
        mockCurrency,
        mockDeviceId,
        mockAccount,
        mockPartyId,
        mockContractId,
        "accept-transfer-instruction",
        reason,
      );

      // THEN
      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        {
          type: "accept-transfer-instruction",
          contract_id: mockContractId,
          reason,
        },
      );
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalledWith(
        mockSigner,
        mockAccount.freshAddressPath,
        mockPreparedTransaction,
      );
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        mockPreparedTransaction.serialized,
        mockSignature.signature,
      );
    });

    it("should reject transfer instruction", async () => {
      // GIVEN
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN
      await transferInstruction(
        mockCurrency,
        mockDeviceId,
        mockAccount,
        mockPartyId,
        mockContractId,
        "reject-transfer-instruction",
      );

      // THEN
      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        {
          type: "reject-transfer-instruction",
          contract_id: mockContractId,
        },
      );
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalled();
    });

    it("should withdraw transfer instruction", async () => {
      // GIVEN
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN
      await transferInstruction(
        mockCurrency,
        mockDeviceId,
        mockAccount,
        mockPartyId,
        mockContractId,
        "withdraw-transfer-instruction",
      );

      // THEN
      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalledWith(
        mockCurrency,
        mockPartyId,
        {
          type: "withdraw-transfer-instruction",
          contract_id: mockContractId,
        },
      );
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalled();
    });

    it("should handle errors from prepareTransferInstruction", async () => {
      // GIVEN
      const error = new Error("Prepare failed");
      mockedGateway.prepareTransferInstruction.mockRejectedValue(error);
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN & THEN
      await expect(
        transferInstruction(
          mockCurrency,
          mockDeviceId,
          mockAccount,
          mockPartyId,
          mockContractId,
          "accept-transfer-instruction",
        ),
      ).rejects.toThrow("Prepare failed");

      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).not.toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).not.toHaveBeenCalled();
    });

    it("should handle errors from signTransaction", async () => {
      // GIVEN
      const error = new Error("Sign failed");
      mockedSignTransaction.signTransaction.mockRejectedValue(error);
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN & THEN
      await expect(
        transferInstruction(
          mockCurrency,
          mockDeviceId,
          mockAccount,
          mockPartyId,
          mockContractId,
          "accept-transfer-instruction",
        ),
      ).rejects.toThrow("Sign failed");

      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).not.toHaveBeenCalled();
    });

    it("should handle errors from submitTransferInstruction", async () => {
      // GIVEN
      const error = new Error("Submit failed");
      mockedGateway.submitTransferInstruction.mockRejectedValue(error);
      const transferInstruction = buildTransferInstruction(mockSignerContext);

      // WHEN & THEN
      await expect(
        transferInstruction(
          mockCurrency,
          mockDeviceId,
          mockAccount,
          mockPartyId,
          mockContractId,
          "accept-transfer-instruction",
        ),
      ).rejects.toThrow("Submit failed");

      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalled();
    });
  });
});
