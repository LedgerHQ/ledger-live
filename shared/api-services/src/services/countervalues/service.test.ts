import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
import { countervaluesApi, cvsApiExtra } from "./api";
import { cvsService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { getCountervaluesServiceUrl: () => "https://cvs.test" };

describe("cvsService", () => {
  it("registers the Countervalues api", () => {
    expect(cvsService(() => own).api).toBe(countervaluesApi);
  });

  it("builds the same extraArgument as cvsApiExtra", () => {
    expect(cvsService(() => own).buildExtra(common)).toEqual(cvsApiExtra(own));
  });

  it("fails at createExtra when the url getter is missing", () => {
    // @ts-expect-error: getCountervaluesServiceUrl is required
    const services = defineApiServices([cvsService(() => ({}))]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
