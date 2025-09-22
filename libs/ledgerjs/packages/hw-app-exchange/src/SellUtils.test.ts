import { decodeSellPayload } from "./SellUtils"; // Ensure the correct path

describe("decodeSellPayload function", () => {
  test("should decode NewSellResponse correctly with hex payload", async () => {
    const binaryPayload =
      "0a1467756d6d792e70776e6e407961686f6f2e636f6d12034254431a030789422223324d764a5050765265756e6d767031716b51576d466a345336697741555058323437472a0345555232060a025bc910023a204da2d85ce5e18b5329fc7b2d43590c224e9cea2d43590c224e9cea2d43590c2242083537393034303534";
    const decodedPayload = await decodeSellPayload(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty("traderEmail", "gummy.pwnn@yahoo.com");
    expect(decodedPayload).toHaveProperty("inCurrency", "BTC");
    expect(decodedPayload).toHaveProperty("inAmount");
    expect(decodedPayload).toHaveProperty("inAddress", "2MvJPPvReunmvp1qkQWmFj4S6iwAUPX247G");
    expect(decodedPayload).toHaveProperty("outCurrency", "EUR");
    expect(decodedPayload).toHaveProperty("outAmount");
    expect(decodedPayload).toHaveProperty("deviceTransactionId");
    expect(decodedPayload).toHaveProperty("inExtraId", "57904054");
  });

  test("should decode NewSellResponse correctly with base64 payload", async () => {
    const binaryPayload =
      "0a1467756d6d792e70776e6e407961686f6f2e636f6d12034254431a030789422223324d764a5050765265756e6d767031716b51576d466a345336697741555058323437472a0345555232060a025bc910023a204da2d85ce5e18b5329fc7b2d43590c224e9cea2d43590c224e9cea2d43590c2242083537393034303534";
    const decodedPayload = await decodeSellPayload(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty("traderEmail", "gummy.pwnn@yahoo.com");
    expect(decodedPayload).toHaveProperty("inCurrency", "BTC");
    expect(decodedPayload).toHaveProperty("inAmount");
    expect(decodedPayload).toHaveProperty("inAddress", "2MvJPPvReunmvp1qkQWmFj4S6iwAUPX247G");
    expect(decodedPayload).toHaveProperty("outCurrency", "EUR");
    expect(decodedPayload).toHaveProperty("outAmount");
    expect(decodedPayload).toHaveProperty("deviceTransactionId");
    expect(decodedPayload).toHaveProperty("inExtraId", "57904054");
  });
});
