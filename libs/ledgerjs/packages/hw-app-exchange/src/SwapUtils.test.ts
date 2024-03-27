import { decodePayloadProtobuf } from "./SwapUtils"; // Asegúrate de proporcionar la ruta correcta

describe("decodePayloadProtobuf function", () => {
  test("should decode NewTransactionResponse correctly without device transaction id", async () => {
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

  test("should decode NewTransactionResponse correctly with device transaction id ng", async () => {
    const binaryPayload =
      "0a2a3078433945463730363132373141633234633533323933393134633842353932453844363130336642651a2a3078393437453537363639663843386332623136334234323035423844394542333138336130373841622a2a3078393437453537363639663843386332623136334234323035423844394542333138336130373841623a0362746342036274634a10000000000018911000000000000000005210c8f34b481ba8000000000000000000005a0131621000000000000000010000000000000000";
    const decodedPayload = await decodePayloadProtobuf(binaryPayload);
    expect(decodedPayload).toBeDefined();
    expect(decodedPayload).toHaveProperty(
      "payinAddress",
      "0xC9EF7061271Ac24c53293914c8B592E8D6103fBe",
    );
    expect(decodedPayload).toHaveProperty(
      "payoutAddress",
      "0x947E57669f8C8c2b163B4205B8D9EB3183a078Ab",
    );
    expect(decodedPayload).toHaveProperty(
      "refundAddress",
      "0x947E57669f8C8c2b163B4205B8D9EB3183a078Ab",
    );
    expect(decodedPayload).toHaveProperty("currencyFrom", "btc");
    expect(decodedPayload).toHaveProperty("currencyTo", "btc");
    expect(decodedPayload).toHaveProperty("deviceTransactionId", "1");
    expect(decodedPayload).toHaveProperty(
      "deviceTransactionIdNg",
      "00000000000000010000000000000000",
    );
    expect(decodedPayload).toHaveProperty("amountToProvider", BigInt(2.969925795867238e25));
    expect(decodedPayload).toHaveProperty("amountToWallet", BigInt(2.671088541873143e38));
  });
});
