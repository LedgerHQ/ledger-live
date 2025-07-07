import { getMinVersion, mustUpgrade, shouldUpgrade } from "./support";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { appConfig } from "./config";
import { DeviceModelId } from "@ledgerhq/device-management-kit";

LiveConfig.setConfig(appConfig);
describe("Support.ts", () => {
  describe("shouldUpgrade", () => {
    it("should ask for an ugprade for an outdated Bitcoin nano app", () => {
      expect(shouldUpgrade("Bitcoin", "0.1.0")).toBe(true);
    });

    it("should not ask for any ugprade for a valid Bitcoin nano app", () => {
      expect(shouldUpgrade("Bitcoin", "1.4.0")).toBe(false);
    });

    it("should not ask for any ugprade for a valid Bitcoin nano app with a pre-release tag", () => {
      expect(shouldUpgrade("Bitcoin", "1.4.0-dev")).toBe(false);
    });
  });

  describe("mustUpgrade", () => {
    it("should ask an upgrade for an outdated nano app", () => {
      expect(mustUpgrade("Ethereum", "0.1.0")).toBe(true);
      expect(mustUpgrade("Ethereum", "1.10.2")).toBe(true);
      expect(mustUpgrade("Ethereum", "1.10.2-rc")).toBe(true);
    });

    it("should not ask any upgrade for the latest Ethereum nano app", () => {
      expect(mustUpgrade("Ethereum", "1.10.3")).toBe(false);
    });

    it("should not ask any upgrade for the latest Ethereum nano app with a pre-release tag for a version equal to the minimum version", () => {
      expect(mustUpgrade("Ethereum", "1.10.3-dev")).toBe(false);
      expect(mustUpgrade("Ethereum", "1.10.3-rc")).toBe(false);
      expect(mustUpgrade("Ethereum", "1.10.3-0")).toBe(false);
    });

    it("should not ask any upgrade for the latest Ethereum nano app with a pre-release tag for a version superior to the minimum version", () => {
      expect(mustUpgrade("Ethereum", "1.10.4-dev")).toBe(false);
    });
  });

  describe("getMinVersion", () => {
    beforeAll(() => {
      LiveConfig.setConfig({
        config_nanoapp_solana: {
          type: "object",
          default: {
            minVersion: "1.1.0",
            nanoxMinVersion: "1.2.0",
          },
        },
        config_nanoapp_bitcoin: {
          type: "object",
          default: {
            minVersion: "invalid",
          },
        },
      });
    });

    it("can not compute a missing version", () => {
      expect(getMinVersion("Ethereum")).toBeUndefined();
    });

    it("can not compute an invalid version", () => {
      expect(getMinVersion("Bitcoin")).toBeUndefined();
    });

    it("computes the fallback min version with no specified device model", () => {
      expect(getMinVersion("Solana")).toEqual("1.1.0");
    });

    it("computes the fallback min version with not in config device model", () => {
      expect(getMinVersion("Solana", DeviceModelId.STAX)).toEqual("1.1.0");
    });

    it("computes the specified device model min version", () => {
      expect(getMinVersion("Solana", DeviceModelId.NANO_X)).toEqual("1.2.0");
    });
  });
});
