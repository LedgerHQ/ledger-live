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
      await getAddressByName("notagoodname");
      fail("Promise should have failed with an invalid name");
    } catch (e) {
      expect(e).toEqual(
        new LedgerAPI4xx(
          'Invalid value for: path parameter name (expected value to pass validation, but got: "notagoodname")'
        )
      );
    }
  });

  it("Error 4xx with invalid name address", async () => {
    try {
      await getAddressByName("notvitalikgoodaddress.eth");
      fail("Promise should have failed with an not found");
    } catch (e) {
      expect(e).toEqual(new LedgerAPI4xx("API HTTP 404"));
    }
  });
});
