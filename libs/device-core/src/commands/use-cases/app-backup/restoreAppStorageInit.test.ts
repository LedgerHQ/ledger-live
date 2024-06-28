import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { restoreAppStorageInit, parseResponse } from "./restoreAppStorageInit";
import { InvalidAppNameLength } from "../../../errors";

jest.mock("@ledgerhq/hw-transport");

describe("restoreAppStorageInit", () => {
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
    const appName = "MyApp";
    const backupSize = 1234;
    await restoreAppStorageInit(transport, appName, backupSize);
    expect(transport.send).toHaveBeenCalledWith(
      0xe0,
      0x6c,
      0x00,
      0x00,
      Buffer.from([0x09, 0x00, 0x00, 0x04, 0xd2, 0x4d, 0x79, 0x41, 0x70, 0x70]),
      [
        StatusCodes.OK,
        StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
        StatusCodes.DEVICE_IN_RECOVERY_MODE,
        StatusCodes.USER_REFUSED_ON_DEVICE,
        StatusCodes.PIN_NOT_SET,
        StatusCodes.INVALID_APP_NAME_LENGTH,
        StatusCodes.INVALID_BACKUP_LENGTH,
      ],
    );
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      expect(() => parseResponse(response)).not.toThrow();
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x67, 0x0a]);
      expect(() => parseResponse(data)).toThrow(
        new InvalidAppNameLength("Invalid application name length, two chars minimum."),
      );
    });
  });
});
