import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  type LoggerSubscriberService,
} from "@ledgerhq/device-management-kit";
import { initDmk, getDeviceManagementKit, resetDmk } from "./dmkInstance";

const mockDmk = {} as DeviceManagementKit;

const mockBuilder = {
  addTransport: jest.fn().mockReturnThis(),
  addLogger: jest.fn().mockReturnThis(),
  addConfig: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockDmk),
};

jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceManagementKitBuilder: jest.fn(() => mockBuilder),
}));

describe("dmkInstance", () => {
  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  describe("initDmk", () => {
    it("builds a DMK instance with the provided transports", () => {
      const transportA = jest.fn();
      const transportB = jest.fn();

      const result = initDmk({ transports: [transportA, transportB] });

      expect(DeviceManagementKitBuilder).toHaveBeenCalledTimes(1);
      expect(mockBuilder.addTransport).toHaveBeenCalledTimes(2);
      expect(mockBuilder.addTransport).toHaveBeenCalledWith(transportA);
      expect(mockBuilder.addTransport).toHaveBeenCalledWith(transportB);
      expect(mockBuilder.build).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockDmk);
    });

    it("adds loggers when provided", () => {
      const logger = { log: jest.fn() } as unknown as LoggerSubscriberService;

      initDmk({ transports: [jest.fn()], loggers: [logger] });

      expect(mockBuilder.addLogger).toHaveBeenCalledWith(logger);
    });

    it("adds config when provided", () => {
      const config = { firmwareDistributionSalt: "salt123" };

      initDmk({ transports: [jest.fn()], config });

      expect(mockBuilder.addConfig).toHaveBeenCalledWith(config);
    });

    it("does not call addLogger or addConfig when not provided", () => {
      initDmk({ transports: [jest.fn()] });

      expect(mockBuilder.addLogger).not.toHaveBeenCalled();
      expect(mockBuilder.addConfig).not.toHaveBeenCalled();
    });

    it("throws if called twice", () => {
      initDmk({ transports: [jest.fn()] });

      expect(() => initDmk({ transports: [jest.fn()] })).toThrow(
        "DeviceManagementKit already initialized. Call initDmk only once.",
      );
    });

    it("allows re-initialization after resetDmk", () => {
      initDmk({ transports: [jest.fn()] });
      resetDmk();

      expect(() => initDmk({ transports: [jest.fn()] })).not.toThrow();
    });
  });

  describe("getDeviceManagementKit", () => {
    it("returns the initialized instance", () => {
      initDmk({ transports: [jest.fn()] });

      expect(getDeviceManagementKit()).toBe(mockDmk);
    });

    it("throws if not initialized", () => {
      expect(() => getDeviceManagementKit()).toThrow(
        "DeviceManagementKit not initialized. Call initDmk first.",
      );
    });
  });

  describe("resetDmk", () => {
    it("clears the singleton so getDeviceManagementKit throws again", () => {
      initDmk({ transports: [jest.fn()] });
      resetDmk();

      expect(() => getDeviceManagementKit()).toThrow(
        "DeviceManagementKit not initialized. Call initDmk first.",
      );
    });
  });
});
