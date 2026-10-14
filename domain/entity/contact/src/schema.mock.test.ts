import { mockContactsFromSendHistory, type MockSendHistoryAccount } from "./schema.mock";

type Operation = MockSendHistoryAccount["operations"][number];

function outOperation(recipient: string, date: string, type = "OUT"): Operation {
  return { type, recipients: [recipient], date: new Date(date) };
}

function ethereumAccount(
  operations: Operation[],
  pendingOperations: Operation[] = [],
): MockSendHistoryAccount {
  return {
    type: "Account",
    currency: { id: "ethereum", ticker: "ETH" },
    operations,
    pendingOperations,
  };
}

describe("mockContactsFromSendHistory", () => {
  it("should return no contacts when accounts have no outgoing operations", () => {
    const account = ethereumAccount([outOperation("0xaaa", "2026-01-01", "IN")]);

    expect(mockContactsFromSendHistory([account])).toEqual([]);
  });

  it("should group recipients so some contacts hold two or three addresses", () => {
    const account = ethereumAccount(
      Array.from({ length: 7 }, (_, index) =>
        outOperation(
          `0x${String(index + 1)
            .repeat(40)
            .slice(0, 40)}`,
          `2026-01-0${index + 1}`,
        ),
      ),
    );

    const contacts = mockContactsFromSendHistory([account]);

    expect(contacts.map(contact => contact.addresses.length)).toEqual([1, 2, 1, 3]);
    expect(contacts[1].addresses.map(address => address.label)).toEqual(["ETH 1", "ETH 2"]);
    expect(contacts.flatMap(contact => contact.addresses)).toHaveLength(7);
  });

  it("should create one contact per distinct recipient ordered by last sent-to", () => {
    const older = "0x1111111111111111111111111111111111111111";
    const newer = "0x2222222222222222222222222222222222222222";
    const account = ethereumAccount([
      outOperation(older, "2026-01-01"),
      outOperation(newer, "2026-03-01"),
      outOperation(older, "2026-02-01"),
    ]);

    const contacts = mockContactsFromSendHistory([account]);

    expect(contacts.map(contact => contact.addresses[0]?.address)).toEqual([newer, older]);
    expect(contacts.every(contact => !contact.isMe)).toBe(true);
    expect(contacts.every(contact => contact.deviceCredentials !== undefined)).toBe(true);
  });

  it("should keep a pending operation as the most recent send", () => {
    const address = "0x3333333333333333333333333333333333333333";
    const account = ethereumAccount(
      [outOperation(address, "2026-01-01")],
      [outOperation(address, "2026-05-01")],
    );

    const contacts = mockContactsFromSendHistory([account]);

    expect(contacts).toHaveLength(1);
    expect(contacts[0].addresses[0]?.address).toBe(address);
  });

  it("should label a token account's addresses with the token ticker", () => {
    const account: MockSendHistoryAccount = {
      type: "TokenAccount",
      token: { id: "ethereum/erc20/usd__coin", ticker: "USDC" },
      operations: [outOperation("0x4444444444444444444444444444444444444444", "2026-01-01")],
      pendingOperations: [],
    };

    expect(mockContactsFromSendHistory([account])[0].addresses[0]).toMatchObject({
      currencyId: "ethereum/erc20/usd__coin",
      label: "USDC",
    });
  });
});
