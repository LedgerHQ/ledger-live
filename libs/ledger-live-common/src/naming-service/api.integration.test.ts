import { getAddressByName } from "./api";
import { LedgerAPI4xx } from "@ledgerhq/errors";

describe("Naming service api", () => {
  it("getAddressByName", async () => {
    expect(await getAddressByName("vitalik.eth")).toEqual(
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
    );
  });

  it("Error 4xx with invalid name address", async () => {
    try {
      await getAddressByName("notanaddress");
    } catch (e) {
      expect(e).toEqual(
        new LedgerAPI4xx(
          'Invalid value for: path parameter name (expected value to pass validation, but got: "notanaddress")'
        )
      );
    }
  });

  it("Error 4xx with invalid name address", async () => {
    try {
      await getAddressByName("notvitalikgoodaddress.eth");
    } catch (e) {
      expect(e).toEqual(new LedgerAPI4xx("API HTTP 404"));
    }
  });
});
