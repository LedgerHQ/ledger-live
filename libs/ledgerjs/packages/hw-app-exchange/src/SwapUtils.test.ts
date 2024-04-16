import { decodePayloadProtobuf } from "./SwapUtils"; // Asegúrate de proporcionar la ruta correcta

describe("decodePayloadProtobuf function", () => {
  test("should decode NewTransactionResponse correctly with hex payload", async () => {
    const binaryPayload =
      "0a2a3078393736633339353463356462626633396135393135313064623332643266386363323235323830371a2a3078636361454263423338373661373561623945393639373530353861413735343633373733303239632a2a626331717164796b647738753336796864736c657477737976347865393573333735716a6a7934676b303a0345544842034254434a10000000000000000001118f178fb48000521000000000000000000000000000080e355a0a5552554f4b5149424f42";
    const decodedPayload = await decodePayloadProtobuf(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty(
      "payinAddress",
      "0x976c3954c5dbbf39a591510db32d2f8cc2252807",
    );
    expect(decodedPayload).toHaveProperty(
      "payoutAddress",
      "bc1qqdykdw8u36yhdsletwsyv4xe95s375qjjy4gk0",
    );
    expect(decodedPayload).toHaveProperty(
      "refundAddress",
      "0xccaEBcB3876a75ab9E96975058aA75463773029c",
    );
    expect(decodedPayload).toHaveProperty("currencyFrom", "ETH");
    expect(decodedPayload).toHaveProperty("currencyTo", "BTC");
    expect(decodedPayload).toHaveProperty("deviceTransactionId", "URUOKQIBOB");
    expect(decodedPayload).toHaveProperty("deviceTransactionIdNg", undefined);
    expect(decodedPayload).toHaveProperty("amountToProvider", BigInt(77000000000000000));
    expect(decodedPayload).toHaveProperty("amountToWallet", BigInt(527925));
  });

  test("should decode NewTransactionResponse correctly with base64 payload", async () => {
    const binaryPayload =
      "CioweEZBRDhjMTA4MGNiQTUwRkRlQzY1RTk0ODUzNEE5YjM4ZGQyNTM2NmYaKjB4RkI0MjRBYUJjMmU0Q2EyZjQ0NzUwMDMwMkREOUVjNjRDRjBlMjZDZSoqYmMxcXo0a3EyOGt2cDM3cHU3cGNxZGQ0dGo1ZnNxODdwcGdlMngzcnE5OgNFVEhCA0JUQ0oQAAAAAAAAAAAA0fcjCjnAAFIQAAAAAAAAAAAAAAAAAARNkFoAYiAIHOswy_grHVflNJ6xgxHiVltXXWqEGSRbKgM1hpV3VQ";
    const decodedPayload = await decodePayloadProtobuf(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty(
      "payinAddress",
      "0xFAD8c1080cbA50FDeC65E948534A9b38dd25366f",
    );
    expect(decodedPayload).toHaveProperty(
      "payoutAddress",
      "bc1qz4kq28kvp37pu7pcqdd4tj5fsq87ppge2x3rq9",
    );
    expect(decodedPayload).toHaveProperty(
      "refundAddress",
      "0xFB424AaBc2e4Ca2f447500302DD9Ec64CF0e26Ce",
    );
    expect(decodedPayload).toHaveProperty("currencyFrom", "ETH");
    expect(decodedPayload).toHaveProperty("currencyTo", "BTC");
    expect(decodedPayload).toHaveProperty("deviceTransactionId", "");
    expect(decodedPayload).toHaveProperty(
      "deviceTransactionIdNg",
      "081ceb30cbf82b1d57e5349eb18311e2565b575d6a8419245b2a033586957755",
    );
    expect(decodedPayload).toHaveProperty("amountToProvider", BigInt(5.91e16));
    expect(decodedPayload).toHaveProperty("amountToWallet", BigInt(2.82e5));
  });
});
