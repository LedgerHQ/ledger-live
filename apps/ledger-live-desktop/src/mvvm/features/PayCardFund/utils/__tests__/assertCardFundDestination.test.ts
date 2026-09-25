import { assertCardFundDestination } from "../assertCardFundDestination";

it("accepts the linked wallet returned by the signed Fund response", () => {
  expect(() =>
    assertCardFundDestination("bc1qcardwalletaddress", "bc1qcardwalletaddress"),
  ).not.toThrow();
});

it("compares EVM addresses without checksum casing", () => {
  expect(() =>
    assertCardFundDestination(
      "0xAbCdEf0123456789aBCdEf0123456789AbCdEf01",
      "0xabcdef0123456789abcdef0123456789abcdef01",
    ),
  ).not.toThrow();
});

it("rejects a payload for a different card wallet", () => {
  expect(() =>
    assertCardFundDestination(
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ),
  ).toThrow("does not target the selected card wallet");
});
