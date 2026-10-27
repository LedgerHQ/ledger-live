import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
import { swapApi, swapApiExtra } from "./api";
import { swapService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { getSwapApiBaseUrl: () => "https://swap.test" };

describe("swapService", () => {
  it("registers the swap api", () => {
    expect(swapService(() => own).api).toBe(swapApi);
  });

  it("builds the same extraArgument as swapApiExtra, with the common config", () => {
    expect(swapService(() => own).buildExtra(common)).toEqual(swapApiExtra({ ...own, ...common }));
  });

  it("fails at createExtra when the url getter is missing", () => {
    // @ts-expect-error: getSwapApiBaseUrl is required
    const services = defineApiServices([swapService(() => ({}))]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
