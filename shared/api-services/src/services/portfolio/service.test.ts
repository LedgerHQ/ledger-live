import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
import { portfolioApi, portfolioApiExtra } from "./api";
import { portfolioService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { portfolioServiceUrl: "https://portfolio.test" };

describe("portfolioService", () => {
  it("registers the Portfolio api", () => {
    expect(portfolioService(() => own).api).toBe(portfolioApi);
  });

  it("builds the same extraArgument as portfolioApiExtra", () => {
    expect(portfolioService(() => own).buildExtra(common)).toEqual(portfolioApiExtra(own));
  });

  it("fails at createExtra when the url is missing", () => {
    // @ts-expect-error: portfolioServiceUrl is required
    const services = defineApiServices([portfolioService(() => ({}))]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
