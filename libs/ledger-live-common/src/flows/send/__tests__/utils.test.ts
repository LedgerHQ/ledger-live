import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
  saveRecentSendRecipient,
  SEND_ADDRESS_FORMAT_OPTIONS,
} from "../utils";
import { getMainAccount, getRecentAddressesStore } from "../../../account/index";
import type { Transaction } from "../../../coin-modules/transaction-types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
  getRecentAddressesStore: jest.fn(),
}));

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetRecentAddressesStore = jest.mocked(getRecentAddressesStore);

describe("saveRecentSendRecipient", () => {
  const addAddress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRecentAddressesStore.mockReturnValue({ addAddress } as never);
    mockedGetMainAccount.mockReturnValue({
      currency: { id: "ethereum" },
    } as never);
  });

  it("should persist the recipient after broadcast", () => {
    saveRecentSendRecipient({ type: "Account", id: "eth-account" } as never, null, {
      recipient: "0xrecipient",
    } as Transaction);

    expect(addAddress).toHaveBeenCalledWith("ethereum", "0xrecipient", undefined);
  });

  it("should prefer the flow ENS name over the transaction domain", () => {
    saveRecentSendRecipient(
      { type: "Account", id: "eth-account" } as never,
      null,
      {
        recipient: "0xrecipient",
        recipientDomain: { domain: "from-transaction.eth" },
      } as Transaction,
      "from-flow.eth",
    );

    expect(addAddress).toHaveBeenCalledWith("ethereum", "0xrecipient", "from-flow.eth");
  });

  it("should skip empty recipients", () => {
    saveRecentSendRecipient({ type: "Account", id: "eth-account" } as never, null, {
      recipient: "   ",
    } as Transaction);

    expect(addAddress).not.toHaveBeenCalled();
  });
});

const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

describe("getRecipientDisplayValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientDisplayValue(null)).toBe("");
  });

  it("should return formatted address without ENS", () => {
    expect(getRecipientDisplayValue({ address: ADDRESS })).toBe("0x123456...12345678");
  });

  it("should keep 8 characters on each side of the ellipsis by default", () => {
    expect(SEND_ADDRESS_FORMAT_OPTIONS).toEqual({ prefixLength: 8, suffixLength: 8 });
  });

  it("should return the address untouched when shorter than the ellipsis threshold", () => {
    expect(getRecipientDisplayValue({ address: "0x1234567890abcdef" })).toBe("0x1234567890abcdef");
  });

  it("should use custom options for formatting", () => {
    expect(
      getRecipientDisplayValue({ address: ADDRESS }, { prefixLength: 4, suffixLength: 4 }),
    ).toBe("0x12...5678");
  });

  it("should return ENS name with formatted address when ENS exists", () => {
    expect(getRecipientDisplayValue({ address: ADDRESS, ensName: "vitalik.eth" })).toBe(
      "vitalik.eth (0x123456...12345678)",
    );
  });
});

describe("getRecipientSearchPrefillValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientSearchPrefillValue(null)).toBe("");
  });

  it("should return address when no ENS", () => {
    expect(getRecipientSearchPrefillValue({ address: "0x1234567890abcdef" })).toBe(
      "0x1234567890abcdef",
    );
  });

  it("should return ENS name when present", () => {
    expect(
      getRecipientSearchPrefillValue({ address: "0x1234567890abcdef", ensName: "vitalik.eth" }),
    ).toBe("vitalik.eth");
  });
});
