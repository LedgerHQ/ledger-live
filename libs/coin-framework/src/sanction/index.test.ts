import axios from "axios";
import { isAddressSanctioned } from ".";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@ledgerhq/live-config/LiveConfig");
const mockedLiveConfig = LiveConfig as jest.Mocked<typeof LiveConfig>;

describe("Testing blacklist functions", () => {
  describe("Testing isAddressBlacklisted", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkBlacklistAddress: true };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });
    });

    it("should return false when feature flag is disabled", async () => {
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkBlacklistAddress: false };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { ETH: [address] },
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return false when check is disabled for a specific coin", async () => {
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkBlacklistAddress: true };
        } else if (key.startsWith("config_currency_")) {
          return { checkBlacklistAddress: false };
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { ETH: [address] },
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return true when the address is blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { ETH: [address] },
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return false when the address is not blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockResolvedValue({
        data: { ETH: ["0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf"] },
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return false when no sanctioned addresses was found", async () => {
      const currency = { ticker: "any random value" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toEqual(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });
  });
});
