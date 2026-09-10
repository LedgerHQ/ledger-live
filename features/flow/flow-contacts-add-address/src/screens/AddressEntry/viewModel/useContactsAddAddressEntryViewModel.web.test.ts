import { act, renderHook } from "@testing-library/react";
import type { ClipboardEvent } from "react";
import {
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  ContactAddressValueSchema,
} from "@domain/entity-contact";
import type { ContactsAddAddressEntryWebProps } from "../components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import { useContactsAddAddressEntryViewModel } from "./useContactsAddAddressEntryViewModel";

jest.mock("@shared/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const RESOLVED_ADDRESS = ContactAddressValueSchema.parse(
  "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
);

type ContactsAddAddressEntryWebBaseOverrides = Partial<
  Omit<ContactsAddAddressEntryWebProps, "addressLabel" | "onAddressLabelChange">
>;

type ContactsAddAddressEntryWebWithLabelOverrides = ContactsAddAddressEntryWebBaseOverrides &
  Required<Pick<ContactsAddAddressEntryWebProps, "addressLabel" | "onAddressLabelChange">>;

function renderViewModel(
  overrides:
    | ContactsAddAddressEntryWebBaseOverrides
    | ContactsAddAddressEntryWebWithLabelOverrides = {},
) {
  const onAddressChange = jest.fn();
  const props: ContactsAddAddressEntryWebProps = {
    addressEntry: { status: "empty", value: "", resolvedAddress: null, inputMethod: null },
    onAddressChange,
    ...overrides,
  } as ContactsAddAddressEntryWebProps;

  return {
    onAddressChange,
    ...renderHook(() => useContactsAddAddressEntryViewModel(props)),
  };
}

describe("useContactsAddAddressEntryViewModel", () => {
  it("should keep confirmation disabled for an empty address", () => {
    const { result } = renderViewModel();

    expect(result.current.isConfirmEnabled).toBe(false);
    expect(result.current.inputStatus).toBeUndefined();
  });

  it("should submit keyboard input as manual", () => {
    const { result, onAddressChange } = renderViewModel();

    act(() => {
      result.current.onChange({
        target: { value: "0x123" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(onAddressChange).toHaveBeenCalledWith("0x123", "manual");
  });

  it("should submit pasted input as paste without reading the clipboard proactively", () => {
    const { result, onAddressChange } = renderViewModel({
      addressEntry: {
        status: "invalid",
        value: "0x12",
        resolvedAddress: null,
        inputMethod: "manual",
        error: "invalid_format",
      },
    });
    const preventDefault = jest.fn();

    act(() => {
      result.current.onPaste({
        currentTarget: { selectionStart: 4, selectionEnd: 4 },
        clipboardData: { getData: () => "34" },
        preventDefault,
      } as unknown as ClipboardEvent<HTMLInputElement>);
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onAddressChange).toHaveBeenCalledWith("0x1234", "paste");
  });

  it("should expose success and an ENS disclaimer for a resolved domain", () => {
    const { result } = renderViewModel({
      addressEntry: {
        status: "valid",
        value: "ledger.eth",
        resolvedAddress: RESOLVED_ADDRESS,
        inputMethod: "ens",
      },
      onConfirm: jest.fn(),
    });

    expect(result.current).toMatchObject({
      inputStatus: "success",
      helperText: "contacts.addAddressEntry.validAddress",
      showEnsDisclaimer: true,
      isConfirmEnabled: true,
    });
  });

  it("should keep confirmation disabled without a confirmation transition", () => {
    const { result } = renderViewModel({
      addressEntry: {
        status: "valid",
        value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        resolvedAddress: RESOLVED_ADDRESS,
        inputMethod: "manual",
      },
    });

    expect(result.current.isConfirmEnabled).toBe(false);
  });

  it("should expose a sanctioned address as a blocking error", () => {
    const onAction = jest.fn();
    const { result } = renderViewModel({
      addressEntry: {
        status: "invalid",
        value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        resolvedAddress: null,
        inputMethod: "manual",
        error: "sanctioned",
      },
      sanctionedAddressBanner: {
        description: "This wallet address is sanctioned.",
        actionLabel: "Learn more",
        onAction,
      },
    });

    expect(result.current).toMatchObject({
      inputStatus: "error",
      helperText: "contacts.addAddressEntry.sanctionedAddress",
      isConfirmEnabled: false,
    });
    expect(result.current.sanctionedAddressBanner).toEqual({
      description: "This wallet address is sanctioned.",
      actionLabel: "Learn more",
      onAction,
    });
  });

  it("should require a valid address label for the combined Desktop form", () => {
    const onAddressLabelChange = jest.fn();
    const { result } = renderViewModel({
      addressEntry: {
        status: "valid",
        value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        resolvedAddress: RESOLVED_ADDRESS,
        inputMethod: "manual",
      },
      addressLabel: {
        status: "invalid",
        value: "Ethereum 💎",
        label: null,
        validationError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
      onAddressLabelChange,
      onConfirm: jest.fn(),
    });

    expect(result.current.isConfirmEnabled).toBe(false);
    expect(result.current.nameValidationMessage).toBe("contacts.addAddressName.invalidLabel");

    act(() => {
      result.current.onAddressLabelChange?.({
        target: { value: "Exchange" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(onAddressLabelChange).toHaveBeenCalledWith("Exchange");
  });

  it("should ignore an incomplete address-label configuration at runtime", () => {
    const { result } = renderViewModel({
      addressEntry: {
        status: "valid",
        value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        resolvedAddress: RESOLVED_ADDRESS,
        inputMethod: "manual",
      },
      addressLabel: {
        status: "invalid",
        value: "Ethereum 💎",
        label: null,
        validationError: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
      },
      onConfirm: jest.fn(),
    } as unknown as ContactsAddAddressEntryWebProps);

    expect(result.current.addressLabel).toBeUndefined();
    expect(result.current.isConfirmEnabled).toBe(true);
  });
});
