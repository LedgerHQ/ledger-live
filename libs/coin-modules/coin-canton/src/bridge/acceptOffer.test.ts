/* eslint-disable @typescript-eslint/consistent-type-assertions */
import prepareTransferMock from "@ledgerhq/hw-app-canton/tests/fixtures/prepare-transfer.json";
import * as signTransactionModule from "../common-logic/transaction/sign";
import * as gateway from "../network/gateway";
import {
  createMockCantonAccount,
  createMockCantonCurrency,
  createMockCantonSignature,
  createMockCantonSigner,
  createMockPrepareTransferResponse,
  createMockSignerContext,
} from "../test/fixtures";
import { TopologyChangeError } from "../types/errors";
import { buildTransferInstruction, createTransferInstruction } from "./acceptOffer";
import * as getTransactionStatusModule from "./getTransactionStatus";

jest.mock("../network/gateway");
jest.mock("../common-logic/transaction/sign");
jest.mock("./getTransactionStatus");

const mockedGateway = gateway as jest.Mocked<typeof gateway>;
const mockedSignTransaction = signTransactionModule as jest.Mocked<typeof signTransactionModule>;
const mockedGetTransactionStatus = getTransactionStatusModule as jest.Mocked<
  typeof getTransactionStatusModule
>;

describe("acceptOffer", () => {
  const mockAccount = createMockCantonAccount();
  const mockCurrency = createMockCantonCurrency();
  const mockContractId = "test-contract-id";
  const mockDeviceId = "test-device-id";
  const mockPartyId = "test-party-id";

  const mockPreparedTransaction = createMockPrepareTransferResponse({
    json: {
      ...prepareTransferMock,
      metadata: {
        ...prepareTransferMock.metadata,
        submitterInfo: {
          ...prepareTransferMock.metadata.submitterInfo,
          actAs: [mockPartyId],
        },
      },
    },
  });

  const mockSignature = createMockCantonSignature();
  const mockSigner = createMockCantonSigner();
  const mockSignerContext = createMockSignerContext(mockSigner);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGateway.prepareTransferInstruction.mockResolvedValue(mockPreparedTransaction);
    mockedGateway.submitTransferInstruction.mockResolvedValue({
      update_id: "test-update-id",
      submission_id: "test-submission-id",
    });
    mockedGetTransactionStatus.validateTopology.mockResolvedValue(null);
    mockedSignTransaction.signTransaction.mockResolvedValue(mockSignature);
  });

  describe("buildTransferInstruction", () => {
    it("should accept transfer instruction without reason", async () => {
      // GIVEN
      const transferInstruction = buildTransferInstruction(mockSignerContext);
      const instruction = createTransferInstruction("accept-transfer-instruction", mockContractId);

      // WHEN
      await transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction);

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
      const instruction = createTransferInstruction(
        "accept-transfer-instruction",
        mockContractId,
        reason,
      );

      // WHEN
      await transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction);

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
      const instruction = createTransferInstruction("reject-transfer-instruction", mockContractId);

      // WHEN
      await transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction);

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
      const instruction = createTransferInstruction(
        "withdraw-transfer-instruction",
        mockContractId,
      );

      // WHEN
      await transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction);

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
      const instruction = createTransferInstruction("accept-transfer-instruction", mockContractId);

      // WHEN & THEN
      await expect(
        transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction),
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
      const instruction = createTransferInstruction("accept-transfer-instruction", mockContractId);

      // WHEN & THEN
      await expect(
        transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction),
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
      const instruction = createTransferInstruction("accept-transfer-instruction", mockContractId);

      // WHEN & THEN
      await expect(
        transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction),
      ).rejects.toThrow("Submit failed");

      expect(mockedGateway.prepareTransferInstruction).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).toHaveBeenCalled();
    });

    it("should throw TopologyChangeError when validateTopology returns topology error", async () => {
      // GIVEN
      const topologyError = new TopologyChangeError("Topology change detected");
      mockedGetTransactionStatus.validateTopology.mockResolvedValue(topologyError);
      const transferInstruction = buildTransferInstruction(mockSignerContext);
      const instruction = createTransferInstruction("accept-transfer-instruction", mockContractId);

      // WHEN & THEN
      await expect(
        transferInstruction(mockCurrency, mockDeviceId, mockAccount, mockPartyId, instruction),
      ).rejects.toThrow(TopologyChangeError);

      expect(mockedGetTransactionStatus.validateTopology).toHaveBeenCalledWith(mockAccount);
      expect(mockedGateway.prepareTransferInstruction).not.toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).not.toHaveBeenCalled();
      expect(mockedGateway.submitTransferInstruction).not.toHaveBeenCalled();
    });
  });
});
