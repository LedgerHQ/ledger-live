import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { restoreAppStorageCommit, parseResponse } from "./restoreAppStorageCommit";

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
    await restoreAppStorageCommit(transport);
    expect(transport.send).toHaveBeenCalledWith(0xe0, 0x6e, 0x00, 0x00, Buffer.from([0x00]), [
      StatusCodes.OK,
      StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
      StatusCodes.FAILED_GEN_AES_KEY,
      StatusCodes.INTERNAL_COMPUTE_AES_CMAC_FAILED,
      StatusCodes.CUSTOM_IMAGE_BOOTLOADER,
      StatusCodes.INVALID_CHUNK_LEN,
    ]);
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      expect(() => parseResponse(response)).not.toThrow();
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x67, 0x34]);
      expect(() => parseResponse(data)).toThrow(new TransportStatusError(0x6734));
    });
  });
});
