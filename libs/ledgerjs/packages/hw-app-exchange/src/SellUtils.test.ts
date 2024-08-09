import { decodeSellPayload } from "./SellUtils"; // Ensure the correct path

describe("decodeSellPayload function", () => {
  test("should decode NewSellResponse correctly with hex payload", async () => {
    const binaryPayload =
      "ChRndW1teS5wd25uQHlhaG9vLmNvbRIDQlRDGgMHiUIiIzJNdkpQUHZSZXVubXZwMXFrUVdtRmo0UzZpd0FVUFgyNDdHKgNFVVIyBgoCW8kQAjogTaLYXOXhi1Mp_Edm6beYPbFvO6plliX8MltsZbbY5oQ";
    const decodedPayload = await decodeSellPayload(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty("traderEmail", "gummy.pwnn@yahoo.com");
    expect(decodedPayload).toHaveProperty("inCurrency", "BTC");
    expect(decodedPayload).toHaveProperty("inAmount");
    expect(decodedPayload).toHaveProperty("inAddress", "2MvJPPvReunmvp1qkQWmFj4S6iwAUPX247G");
    expect(decodedPayload).toHaveProperty("outCurrency", "EUR");
    expect(decodedPayload).toHaveProperty("outAmount");
    expect(decodedPayload).toHaveProperty("deviceTransactionId");
  });

  test("should decode NewSellResponse correctly with base64 payload", async () => {
    const binaryPayload =
      "ChRndW1teS5wd25uQHlhaG9vLmNvbRIDQlRDGgMHiUIiIzJNdkpQUHZSZXVubXZwMXFrUVdtRmo0UzZpd0FVUFgyNDdHKgNFVVIyBgoCW8kQAjogTaLYXOXhi1Mp_Edm6beYPbFvO6plliX8MltsZbbY5oQ";
    const decodedPayload = await decodeSellPayload(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty("traderEmail", "gummy.pwnn@yahoo.com");
    expect(decodedPayload).toHaveProperty("inCurrency", "BTC");
    expect(decodedPayload).toHaveProperty("inAmount");
    expect(decodedPayload).toHaveProperty("inAddress", "2MvJPPvReunmvp1qkQWmFj4S6iwAUPX247G");
    expect(decodedPayload).toHaveProperty("outCurrency", "EUR");
    expect(decodedPayload).toHaveProperty("outAmount");
    expect(decodedPayload).toHaveProperty("deviceTransactionId");
  });
});
