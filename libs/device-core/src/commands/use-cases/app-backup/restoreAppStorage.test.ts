import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { restoreAppStorage, parseResponse } from "./restoreAppStorage";
import { InvalidRestoreState } from "../../../errors";

jest.mock("@ledgerhq/hw-transport");

describe("restoreAppStorage", () => {
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
    const chunk = Buffer.from("106RueduTemple");
    const args = [
      0xe0,
      0x6d,
      0x00,
      0x00,
      chunk,
      [
        StatusCodes.OK,
        StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
        StatusCodes.GEN_AES_KEY_FAILED,
        StatusCodes.INTERNAL_CRYPTO_OPERATION_FAILED,
        StatusCodes.DEVICE_IN_RECOVERY_MODE,
        StatusCodes.INVALID_RESTORE_STATE,
        StatusCodes.INVALID_CHUNK_LENGTH,
        StatusCodes.INVALID_BACKUP_HEADER,
      ],
    ];

    await restoreAppStorage(transport, chunk);
    expect(transport.send).toHaveBeenCalledWith(...args);
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      expect(() => parseResponse(response)).not.toThrow();
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x66, 0x43]);
      expect(() => parseResponse(data)).toThrow(
        new InvalidRestoreState("Invalid restore state, restore already performed."),
      );
    });
  });
});
