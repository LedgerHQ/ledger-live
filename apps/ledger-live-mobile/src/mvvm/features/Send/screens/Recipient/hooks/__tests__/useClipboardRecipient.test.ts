import { renderHook, waitFor } from "@testing-library/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { AppState } from "react-native";
import { useAddressValidation } from "../useAddressValidation";
import { useClipboardRecipient } from "../useClipboardRecipient";

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { getString: jest.fn() },
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => callback(), [callback]);
  }),
}));

jest.mock("../useAddressValidation");
jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState");

const mockedGetString = jest.mocked(Clipboard.getString);
const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseRecipientSearchState = jest.mocked(useRecipientSearchState);
const removeAppStateListener = jest.fn();

const currency = { id: "ethereum", family: "evm" } as unknown as CryptoCurrency;
const account = { id: "account_1", type: "Account" } as unknown as AccountLike;

function setSearchState(isAddressComplete: boolean) {
  mockedUseRecipientSearchState.mockReturnValue({
    isAddressComplete,
  } as ReturnType<typeof useRecipientSearchState>);
}

function renderClipboardRecipient(enabled = true) {
  return renderHook(() =>
    useClipboardRecipient({
      enabled,
      currency,
      account,
      currentAccountId: "account_1",
      recipientSupportsDomain: true,
    }),
  );
}

describe("useClipboardRecipient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, "addEventListener").mockReturnValue({
      remove: removeAppStateListener,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: {} as ReturnType<typeof useAddressValidation>["result"],
      isLoading: false,
      validateAddress: jest.fn(),
    });
    setSearchState(true);
  });

  it("exposes the clipboard content when it is a valid recipient", async () => {
    mockedGetString.mockResolvedValue("0x1234567890abcdef");

    const { result } = renderClipboardRecipient();

    await waitFor(() => {
      expect(result.current.clipboardAddress).toBe("0x1234567890abcdef");
    });
  });

  it("returns null when the clipboard content is not a valid recipient format", async () => {
    mockedGetString.mockResolvedValue("0x1234567890abcdef");
    setSearchState(false);

    const { result } = renderClipboardRecipient();

    await waitFor(() => expect(mockedGetString).toHaveBeenCalled());
    expect(result.current.clipboardAddress).toBeNull();
  });

  it("ignores clipboard content that is clearly not a recipient (contains whitespace)", async () => {
    mockedGetString.mockResolvedValue("some random copied text");

    const { result } = renderClipboardRecipient();

    await waitFor(() => expect(mockedGetString).toHaveBeenCalled());
    expect(result.current.clipboardAddress).toBeNull();
    // bridge validation should not even be run on the prose candidate
    expect(mockedUseAddressValidation).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchValue: "" }),
    );
  });

  it("does not read the clipboard when disabled", async () => {
    mockedGetString.mockResolvedValue("0x1234567890abcdef");

    const { result } = renderClipboardRecipient(false);

    await waitFor(() => {
      expect(result.current.clipboardAddress).toBeNull();
    });
    expect(mockedGetString).not.toHaveBeenCalled();
  });
});
