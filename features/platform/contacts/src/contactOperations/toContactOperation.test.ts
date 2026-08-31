import { toContactOperation } from "./toContactOperation";

const date = new Date("2024-01-02T00:00:00.000Z");

describe("toContactOperation", () => {
  it("maps an incoming transfer onto senders", () => {
    expect(
      toContactOperation({
        id: "op-in",
        type: "IN",
        currencyId: "ethereum",
        date,
        senders: ["0xsender"],
        recipients: ["0xself"],
      }),
    ).toEqual({
      id: "op-in",
      type: "IN",
      currencyId: "ethereum",
      date: date.getTime(),
      senders: ["0xsender"],
    });
  });

  it("maps an outgoing transfer onto recipients", () => {
    expect(
      toContactOperation({
        id: "op-out",
        type: "OUT",
        currencyId: "bitcoin",
        date,
        senders: ["0xself"],
        recipients: ["0xrecipient"],
      }),
    ).toEqual({
      id: "op-out",
      type: "OUT",
      currencyId: "bitcoin",
      date: date.getTime(),
      recipients: ["0xrecipient"],
    });
  });

  it("returns null for operation types without a contact counterparty", () => {
    expect(
      toContactOperation({
        id: "op-fee",
        type: "FEES",
        currencyId: "ethereum",
        date,
        senders: ["0xself"],
        recipients: [],
      }),
    ).toBeNull();
  });
});
