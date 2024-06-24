import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { backupAppStorage, parseResponse } from "./backupAppStorage";
import { InternalComputeAesCmacFailed } from "../../../errors";

jest.mock("@ledgerhq/hw-transport");

describe("backupAppStorage", () => {
  let transport: Transport;
  const response = Buffer.from([
    0x31, 0x30, 0x36, 0x52, 0x75, 0x65, 0x64, 0x75, 0x54, 0x65, 0x6d, 0x70, 0x6c, 0x65, 0x90, 0x00,
  ]);

  beforeEach(() => {
    transport = {
      send: jest.fn().mockResolvedValue(response),
      getTraceContext: jest.fn().mockResolvedValue(undefined),
    } as unknown as Transport;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the send function with correct parameters", async () => {
    await backupAppStorage(transport);
    expect(transport.send).toHaveBeenCalledWith(0xe0, 0x6b, 0x00, 0x00, Buffer.from([0x00]), [
      StatusCodes.OK,
      StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
      StatusCodes.GEN_AES_KEY_FAILED,
      StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
      StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
      StatusCodes.ENCRYPT_APP_STORAGE_FAILED,
      StatusCodes.DEVICE_IN_RECOVERY_MODE,
      StatusCodes.INVALID_BACKUP_STATE,
    ]);
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      const expected = Buffer.from([
        0x31, 0x30, 0x36, 0x52, 0x75, 0x65, 0x64, 0x75, 0x54, 0x65, 0x6d, 0x70, 0x6c, 0x65,
      ]);
      expect(parseResponse(response)).toStrictEqual(expected);
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x54, 0x1b]);
      expect(() => parseResponse(data)).toThrow(
        new InternalComputeAesCmacFailed("Internal error, failed to compute AES CMAC."),
      );
    });
  });
});
