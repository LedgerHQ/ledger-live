import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { getAppStorageInfo, parseResponse } from "./getAppStorageInfo";
import { AppStorageInfo } from "../../entities/AppStorageInfo";
import { InvalidAppNameLength } from "../../../errors";

jest.mock("@ledgerhq/hw-transport");

describe("getAppStorageInfo", () => {
  let transport: Transport;
  const response = Buffer.from([
    0x00, 0x00, 0x04, 0xd2, 0x31, 0x2e, 0x30, 0x31, 0x01, 0x01, 0x68, 0x61, 0x73, 0x68, 0x68, 0x61,
    0x73, 0x68, 0x31, 0x32, 0x33, 0x34, 0x68, 0x61, 0x73, 0x68, 0x68, 0x61, 0x73, 0x68, 0x68, 0x61,
    0x73, 0x68, 0x68, 0x61, 0x73, 0x68, 0x68, 0x61, 0x73, 0x68, 0x90, 0x00,
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
    const appName = "MyApp";
    await getAppStorageInfo(transport, appName);
    expect(transport.send).toHaveBeenCalledWith(
      0xe0,
      0x6a,
      0x00,
      0x00,
      Buffer.from([0x05, 0x4d, 0x79, 0x41, 0x70, 0x70]),
      [
        StatusCodes.OK,
        StatusCodes.APP_NOT_FOUND_OR_INVALID_CONTEXT,
        StatusCodes.DEVICE_IN_RECOVERY_MODE,
        StatusCodes.INVALID_APP_NAME_LENGTH,
      ],
    );
  });

  describe("parseResponse", () => {
    it("should parse the response data correctly", () => {
      const expected: AppStorageInfo = {
        size: 1234,
        dataVersion: "1.01",
        hasSettings: true,
        hasData: true,
        hash: "hashhash1234hashhashhashhashhash",
      };
      expect(parseResponse(response)).toStrictEqual(expected);
    });
    it("should throw TransportStatusError if the response status is invalid", () => {
      const data = Buffer.from([0x67, 0x0a]);
      expect(() => parseResponse(data)).toThrow(
        new InvalidAppNameLength("Invalid application name length, two chars minimum."),
      );
    });
  });
});
