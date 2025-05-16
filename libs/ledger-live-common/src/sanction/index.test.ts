import axios from "axios";
import { isAddressSanctioned } from ".";
import { LedgerAPI4xx } from "@ledgerhq/errors";
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
      mockedLiveConfig.getValueByKey.mockReturnValue([]);
    });

    it("should return true when the address is blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";
      mockedAxios.get.mockResolvedValue({
        data: [address],
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://ofac-compliance.pages.dev/sanctioned_addresses_${currency.ticker.toUpperCase()}.json`,
      );
    });

    it("should return false when the address is not blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockResolvedValue({
        data: ["0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf"],
      });

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://ofac-compliance.pages.dev/sanctioned_addresses_${currency.ticker.toUpperCase()}.json`,
      );
    });

    it("should return false when no sanctioned addresses was found", async () => {
      const currency = { ticker: "any random value" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockRejectedValue(new LedgerAPI4xx("", { status: 404, url: "", method: "" }));

      const result = await isAddressSanctioned(currency, address);
      expect(result).toEqual(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://ofac-compliance.pages.dev/sanctioned_addresses_${currency.ticker.toUpperCase()}.json`,
      );
    });

    it.each([
      new Error("some random error message"),
      new LedgerAPI4xx("", { status: 400, url: "", method: "" }),
    ])("should throw an error when the error is not a 404 http error", async () => {
      const currency = { ticker: "any random value" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";
      mockedAxios.get.mockRejectedValue(new Error("File not found"));

      try {
        await isAddressSanctioned(currency, address);
        throw new Error("Test must throw an error");
      } catch (error) {
        expect((error as Error).message).toBe("File not found");
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `https://ofac-compliance.pages.dev/sanctioned_addresses_${currency.ticker.toUpperCase()}.json`,
        );
      }
    });
  });
});
