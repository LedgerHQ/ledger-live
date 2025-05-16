import axios from "axios";
import { isAddressSanctioned } from ".";
import { LiveConfig } from "@ledgerhq/live-config/lib/LiveConfig";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

LiveConfig.setConfig({
  config_currency: {
    type: "object",
    default: {
      checkBlacklistAddress: true,
    },
  },
  tmp_sanctioned_addresses: {
    type: "object",
    default: {},
  },
});
const spiedAxios = jest.spyOn(axios, "get");

describe("Testing blacklist functions", () => {
  describe("Testing isAddressBlacklisted", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return true when the address is blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf";

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(true);
      expect(spiedAxios).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return false when the address is not blacklisted", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";

      const result = await isAddressSanctioned(currency, address);
      expect(result).toBe(false);
      expect(spiedAxios).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });

    it("should return false when no sanctioned addresses for the currency was found", async () => {
      const currency = { ticker: "ETH" } as unknown as CryptoCurrency;
      const address = "0xc0ffee254729296a45a3885639AC7E10F9d54979";

      const result = await isAddressSanctioned(currency, address);
      expect(result).toEqual(false);
      expect(spiedAxios).toHaveBeenCalledWith(
        "https://ofac-compliance.pages.dev/all_sanctioned_addresses.json",
      );
    });
  });
});
