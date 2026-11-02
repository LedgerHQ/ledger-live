import { defineApiServices } from "../../compose";
import { dadaApi } from "./api";
import { dadaService } from "./service";

const common = { ledgerClientVersion: "test" };

describe("dadaService", () => {
  it("registers the DADA api", () => {
    expect(dadaService().api).toBe(dadaApi);
  });

  it("adds nothing to the extraArgument", () => {
    expect(defineApiServices([dadaService()]).createExtra(common)).toEqual({});
  });
});
