import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { restoreAppStorage, parseResponse } from "./restoreAppStorage";

jest.mock("@ledgerhq/hw-transport");

describe("getAppStorageInfo", () => {
  let transport: Transport;
  const response = Buffer.from([0x90, 0x00]);

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
    const chunk = "106 Rue du Temple";
    await restoreAppStorage(transport, chunk);
    expect(transport.send).toHaveBeenCalledWith(
      0xe0,
      0x6d,
      0x00,
      0x00,
      Buffer.from([
        0x11, 0x31, 0x30, 0x36, 0x20, 0x52, 0x75, 0x65, 0x20, 0x64, 0x75, 0x20, 0x54, 0x65, 0x6d,
        0x70, 0x6c, 0x65,
      ]),
      [
        StatusCodes.OK,
        StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
        StatusCodes.FAILED_GEN_AES_KEY,
        StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
        StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
        StatusCodes.INVALID_RESTORE_STATE,
        StatusCodes.INVALID_CHUNK_LEN,
        StatusCodes.INVALID_BACKUP_HEADER,
      ],
    );
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      expect(() => parseResponse(response)).not.toThrow();
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x66, 0x43]);
      expect(() => parseResponse(data)).toThrow(new TransportStatusError(0x6643));
    });
  });
});
