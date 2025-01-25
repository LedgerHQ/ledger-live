import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import resolver from "../../signer";

describe("aptos signer", () => {
  test("getAddress", async () => {
    const getAddress = resolver(
      async () =>
        ({
          address: "address",
          publicKey: Buffer.from("publicKey"),
        }) as any,
    );
    const result = await getAddress("deviceId", {
      path: "path",
      currency: getCryptoCurrencyById("aptos"),
      derivationMode: "",
    });
    expect(result).toMatchObject({
      address: "address",
      publicKey: "7075626c69634b6579",
      path: "path",
    });
  });
});
