import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";

jest.mock("@ledgerhq/live-common/utils/addressUtils", () => ({
  formatAddress: jest.fn(),
}));

const mockedFormatAddress = jest.mocked(formatAddress);

describe("getRecipientDisplayValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty string when recipient is null", () => {
    expect(getRecipientDisplayValue(null)).toBe("");
  });

  it("returns formatted address when no ensName", () => {
    mockedFormatAddress.mockReturnValue("0x1234...5678");
    const recipient = { address: "0x1234567890123456789012345678901234567890" };

    expect(getRecipientDisplayValue(recipient)).toBe("0x1234...5678");
    expect(mockedFormatAddress).toHaveBeenCalledWith(recipient.address, {
      prefixLength: 5,
      suffixLength: 5,
    });
  });

  it("returns ensName with formatted address when ensName exists", () => {
    mockedFormatAddress.mockReturnValue("0x1234...5678");
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "vitalik.eth",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("vitalik.eth (0x1234...5678)");
    expect(mockedFormatAddress).toHaveBeenCalledWith(recipient.address, {
      prefixLength: 5,
      suffixLength: 5,
    });
  });

  it("handles different address formats", () => {
    mockedFormatAddress.mockReturnValue("bc1q...xyz");
    const recipient = {
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("bc1q...xyz");
  });

  it("handles empty ensName string", () => {
    mockedFormatAddress.mockReturnValue("0x1234...5678");
    const recipient = {
      address: "0x1234567890123456789012345678901234567890",
      ensName: "",
    };

    expect(getRecipientDisplayValue(recipient)).toBe("0x1234...5678");
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
