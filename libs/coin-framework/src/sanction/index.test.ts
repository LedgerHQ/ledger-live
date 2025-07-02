import axios from "axios";
import { isAddressSanctioned } from ".";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { setEnv } from "@ledgerhq/live-env";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@ledgerhq/live-config/LiveConfig");
const mockedLiveConfig = LiveConfig as jest.Mocked<typeof LiveConfig>;

const VALID_SACTIONED_ADDRESS_URL =
  "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json";

const CURRENCY = { ticker: "ETH" } as unknown as CryptoCurrency;

describe("Testing blacklist functions", () => {
  describe("Testing isAddressBlacklisted", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkSanctionedAddress: true };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      setEnv("SANCTIONED_ADDRESSES_URL", VALID_SACTIONED_ADDRESS_URL);
    });

    it("should return false when calling sanctioned address url returns an error", async () => {
      const randomInvalidUrl = "some random invalid url";
      setEnv("SANCTIONED_ADDRESSES_URL", randomInvalidUrl);

      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkSanctionedAddress: false };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { bannedAddresses: [address] },
      });

      const result = await isAddressSanctioned(CURRENCY, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalledWith(randomInvalidUrl);
    });

    it("should return false when feature flag is disabled", async () => {
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkSanctionedAddress: false };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { bannedAddresses: [address] },
      });

      const result = await isAddressSanctioned(CURRENCY, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalledWith(VALID_SACTIONED_ADDRESS_URL);
    });

    it("should return false when check is disabled for a specific coin", async () => {
      mockedLiveConfig.getValueByKey.mockImplementation(key => {
        if (key === "config_currency") {
          return { checkSanctionedAddress: true };
        } else if (key.startsWith("config_currency_")) {
          return { checkSanctionedAddress: false };
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }

        throw new Error(`key ${key} is not handled in test`);
      });

      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { bannedAddresses: [address] },
      });

      const result = await isAddressSanctioned(CURRENCY, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalledWith(VALID_SACTIONED_ADDRESS_URL);
    });

    it("should return true when the address is blacklisted", async () => {
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: { bannedAddresses: [address] },
      });

      const result = await isAddressSanctioned(
        { ticker: "ETH" } as unknown as CryptoCurrency,
        address,
      );
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(VALID_SACTIONED_ADDRESS_URL);
    });

    it("should return false when the address is not blacklisted", async () => {
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockResolvedValue({
        data: { bannedAddresses: ["0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf"] },
      });

      const result = await isAddressSanctioned(CURRENCY, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(VALID_SACTIONED_ADDRESS_URL);
    });

    it("should return false when no sanctioned addresses was found", async () => {
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      const result = await isAddressSanctioned(
        { ticker: "any random value" } as unknown as CryptoCurrency,
        address,
      );
      expect(result).toEqual(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(VALID_SACTIONED_ADDRESS_URL);
    });
  });
});
