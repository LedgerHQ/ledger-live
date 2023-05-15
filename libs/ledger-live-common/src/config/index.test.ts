import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration } from ".";
import network from "../network";
import defaultConfig from "./defaultConfig";
jest.mock("../network");

describe("getCurrencyConfiguration", () => {
  const cosmosCurrencyMock = {
    family: "cosmos",
    id: "cosmos",
  } as CryptoCurrency;

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  afterEach(() => {
    getCurrencyConfiguration.reset();
  });

  describe("when config fetching is successful", () => {
    it("should return the related currency config", async () => {
      const remoteConfigMock = {
        data: {
          config: { cosmos: { cosmos: { lcd: "toto" } } },
        },
      };
      // @ts-expect-error method is mocked
      network.mockResolvedValueOnce(remoteConfigMock);
      const config = await getCurrencyConfiguration(cosmosCurrencyMock);
      expect(config).toEqual(remoteConfigMock.data);
    });
  });

  describe("when config fetching returns null", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockResolvedValueOnce("null");
    });

    it("should return the local currency config and warn the user", async () => {
      const config = await getCurrencyConfiguration(cosmosCurrencyMock);
      expect(config).toEqual(defaultConfig.config["cosmos"]["cosmos"]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should return an error if currency isn't defined in local config", async () => {
      await expect(
        getCurrencyConfiguration({
          id: "idontexistasacurrency",
          family: "ihavenofamily",
        } as unknown as CryptoCurrency)
      ).rejects.toThrow(Error);
    });
  });

  describe("when config fetching fails", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockRejectedValueOnce({});
    });

    it("should return the local currency config and warn the user", async () => {
      const config = await getCurrencyConfiguration(cosmosCurrencyMock);
      expect(config).toEqual(defaultConfig.config["cosmos"]["cosmos"]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should return an error if currency isn't defined in local config", async () => {
      await expect(
        getCurrencyConfiguration({
          id: "idontexistasacurrency",
          family: "ihavenofamily",
        } as unknown as CryptoCurrency)
      ).rejects.toThrow(Error);
    });
  });
});
