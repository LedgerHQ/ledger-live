import { decodeFundPayload } from "./FundUtils";

describe("decodeFundPayload function", () => {
  const expected = {
    userId: "user-42",
    accountName: "Card 1234",
    inCurrency: "XRP",
    inAddress: "rN7n7otQDd6FczFgLdlqtyMVrn3LNU1Zbn",
    inExtraId: "123456",
    inAmount: Buffer.from("01118f178fb48000", "hex"),
    deviceTransactionId: Buffer.from(
      "081ceb30cbf82b1d57e5349eb18311e2565b575d6a8419245b2a033586957755",
      "hex",
    ),
  };

  test("should decode NewFundResponse correctly with hex payload", async () => {
    const binaryPayload =
      "0a07757365722d343212094361726420313233341a03585250220801118f178fb480002a22724e376e376f745144643646637a46674c646c7174794d56726e334c4e55315a626e3220081ceb30cbf82b1d57e5349eb18311e2565b575d6a8419245b2a0335869577553a06313233343536";

    const decodedPayload = await decodeFundPayload(binaryPayload);

    expect(decodedPayload).toMatchObject({
      userId: expected.userId,
      accountName: expected.accountName,
      inCurrency: expected.inCurrency,
      inAddress: expected.inAddress,
      inExtraId: expected.inExtraId,
    });
    expect(Buffer.from(decodedPayload.inAmount)).toEqual(expected.inAmount);
    expect(Buffer.from(decodedPayload.deviceTransactionId)).toEqual(expected.deviceTransactionId);
  });

  test("should decode NewFundResponse correctly with base64 payload", async () => {
    const binaryPayload =
      "Cgd1c2VyLTQyEglDYXJkIDEyMzQaA1hSUCIIARGPF4+0gAAqInJON243b3RRRGQ2RmN6RmdMZGxxdHlNVnJuM0xOVTFaYm4yIAgc6zDL+CsdV+U0nrGDEeJWW1ddaoQZJFsqAzWGlXdVOgYxMjM0NTY=";

    const decodedPayload = await decodeFundPayload(binaryPayload);

    expect(decodedPayload).toMatchObject({
      userId: expected.userId,
      accountName: expected.accountName,
      inCurrency: expected.inCurrency,
      inAddress: expected.inAddress,
      inExtraId: expected.inExtraId,
    });
    expect(Buffer.from(decodedPayload.inAmount)).toEqual(expected.inAmount);
    expect(Buffer.from(decodedPayload.deviceTransactionId)).toEqual(expected.deviceTransactionId);
  });
});
