import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { reinstallConfigurationConsent } from "./reinstallConfigurationConsent";
import { PinNotSet, UserRefusedOnDevice } from "@ledgerhq/errors";

describe("reinstallConfigurationConsent", () => {
  let transport: Transport;

  beforeEach(() => {
    transport = {
      send: jest.fn().mockResolvedValue(Buffer.from([])),
      getTraceContext: jest.fn().mockResolvedValue(undefined),
    } as unknown as Transport;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success cases", () => {
    it("should call the send function with correct parameters", async () => {
      transport.send = jest.fn().mockResolvedValue(Buffer.from([0x90, 0x00]));
      await reinstallConfigurationConsent(transport, [0x00, 0x00, 0x00, 0x00]);
      expect(transport.send).toHaveBeenCalledWith(
        0xe0,
        0x6f,
        0x00,
        0x00,
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        [StatusCodes.OK, StatusCodes.USER_REFUSED_ON_DEVICE, StatusCodes.PIN_NOT_SET],
      );
    });
  });

  describe("error cases", () => {
    it("should throw UserRefusedOnDevice if the user refused on device", async () => {
      transport.send = jest.fn().mockResolvedValue(Buffer.from([0x55, 0x01]));
      await expect(
        reinstallConfigurationConsent(transport, [0x00, 0x00, 0x00, 0x00]),
      ).rejects.toThrow(new UserRefusedOnDevice("User refused on device"));
    });

    it("should throw PINNotSet if the PIN is not set", async () => {
      transport.send = jest.fn().mockResolvedValue(Buffer.from([0x55, 0x02]));
      await expect(
        reinstallConfigurationConsent(transport, [0x00, 0x00, 0x00, 0x00]),
      ).rejects.toThrow(new PinNotSet("PIN not set"));
    });

    it("should throw TransportStatusError if the response status is invalid", async () => {
      transport.send = jest.fn().mockResolvedValue(Buffer.from([0x6f, 0x00]));
      await expect(
        reinstallConfigurationConsent(transport, [0x00, 0x00, 0x00, 0x00]),
      ).rejects.toThrow(new TransportStatusError(0x6f00));
    });
  });
});
