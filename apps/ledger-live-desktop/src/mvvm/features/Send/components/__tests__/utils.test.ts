import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@features/platform-send-flow";

describe("getRecipientDisplayValue", () => {
  it("returns empty string when recipient is null", () => {
    expect(getRecipientDisplayValue(null)).toBe("");
  });

  it("returns formatted address when no ensName", () => {
    const recipient = { address: "0x1234567890123456789012345678901234567890" };

    expect(getRecipientDisplayValue(recipient)).toBe("0x123456...34567890");
  });

  it("returns ensName with formatted address when ensName exists", () => {
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "vitalik.eth",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("vitalik.eth (0x123456...34567890)");
  });

  it("handles different address formats", () => {
    const recipient = {
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("bc1qw508...7kv8f3t4");
  });

  it("handles empty ensName string", () => {
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("0x123456...34567890");
  });
});

describe("getRecipientSearchPrefillValue", () => {
  it("returns empty string when recipient is null", () => {
    expect(getRecipientSearchPrefillValue(null)).toBe("");
  });

  it("returns address when no ensName", () => {
    const recipient = { address: "0x1234567890123456789012345678901234567890" };

    expect(getRecipientSearchPrefillValue(recipient)).toBe(recipient.address);
  });

  it("returns ensName when ensName exists", () => {
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "vitalik.eth",
    };

    expect(getRecipientSearchPrefillValue(recipient)).toBe("vitalik.eth");
  });

  it("prefers ensName over address", () => {
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "alice.eth",
    };

    expect(getRecipientSearchPrefillValue(recipient)).toBe("alice.eth");
    expect(getRecipientSearchPrefillValue(recipient)).not.toBe(recipient.address);
  });

  it("handles empty ensName string", () => {
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "",
    };

    expect(getRecipientSearchPrefillValue(recipient)).toBe(recipient.address);
  });

  it("handles different address formats", () => {
    const recipient = {
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    };

    expect(getRecipientSearchPrefillValue(recipient)).toBe(recipient.address);
  });
});
