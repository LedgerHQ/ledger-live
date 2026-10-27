import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
import { coinMarketCapApi, coinMarketCapApiExtra } from "./api";
import { coinMarketCapService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { coinMarketCapApiUrl: "https://cmc.test" };

describe("coinMarketCapService", () => {
  it("registers the CoinMarketCap api", () => {
    expect(coinMarketCapService(() => own).api).toBe(coinMarketCapApi);
  });

  it("builds the same extraArgument as coinMarketCapApiExtra", () => {
    expect(coinMarketCapService(() => own).buildExtra(common)).toEqual(coinMarketCapApiExtra(own));
  });

  it("fails at createExtra when the url is missing", () => {
    // @ts-expect-error: coinMarketCapApiUrl is required
    const services = defineApiServices([coinMarketCapService(() => ({}))]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
