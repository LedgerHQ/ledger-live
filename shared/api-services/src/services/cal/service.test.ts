import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
import { calApi, calApiExtra } from "./api";
import { calService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { calServiceUrl: "https://cal.test" };

describe("calService", () => {
  it("registers the CAL api", () => {
    expect(calService(() => own).api).toBe(calApi);
  });

  it("builds the same extraArgument as calApiExtra, with the common config", () => {
    expect(calService(() => own).buildExtra(common)).toEqual(calApiExtra({ ...own, ...common }));
  });

  it("fails at createExtra when the service url is empty", () => {
    const services = defineApiServices([calService(() => ({ calServiceUrl: "" }))]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
