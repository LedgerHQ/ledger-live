import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { backupAppStorage, parseResponse } from "./backupAppStorage";

jest.mock("@ledgerhq/hw-transport");

describe("getAppStorageInfo", () => {
  let transport: Transport;
  const response = Buffer.from([
    0x31, 0x30, 0x36, 0x20, 0x52, 0x75, 0x65, 0x20, 0x64, 0x75, 0x20, 0x54, 0x65, 0x6d, 0x70, 0x6c,
    0x65, 0x90, 0x00,
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
      StatusCodes.FAILED_GEN_AES_KEY,
      StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
      StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
      StatusCodes.APP_STORAGE_ENCRYPT_FAILED,
      StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
      StatusCodes.INVALID_BACKUP_STATE,
    ]);
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      const expected = "106 Rue du Temple";
      expect(parseResponse(response)).toStrictEqual(expected);
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x54, 0x1b]);
      expect(() => parseResponse(data)).toThrow(new TransportStatusError(0x541b));
    });
  });
});
