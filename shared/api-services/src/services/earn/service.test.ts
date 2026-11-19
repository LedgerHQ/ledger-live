import { defineApiServices } from "../../compose";
import { earnApi, earnApiExtra } from "./api";
import { earnService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { earnApiBaseUrl: "https://earn.test" };

describe("earnService", () => {
  it("registers the Earn api", () => {
    expect(earnService(() => own).api).toBe(earnApi);
  });

  it("builds the same extraArgument as earnApiExtra", () => {
    expect(earnService(() => own).buildExtra(common)).toEqual(earnApiExtra(own));
  });

  it("keeps an empty base url at createExtra, so the app boots with the service disabled", () => {
    const services = defineApiServices([earnService(() => ({ earnApiBaseUrl: "" }))]);

    expect(services.createExtra(common)).toEqual({ earnApiBaseUrl: "" });
  });
});
