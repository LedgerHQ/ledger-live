import { act, renderHook } from "@testing-library/react";
import type { ClipboardEvent } from "react";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import { createInitialEditAddressEntryState } from "./model/addressEntryValidation";
import { useEditAddressDialogPresentation } from "./useEditAddressDialogPresentation.web";

const labels = {
  addressPlaceholder: "Address",
  validatingAddress: "Validating",
  validAddress: "Valid",
  invalidAddress: "Invalid",
  domainNotFound: "Domain not found",
  sanctionedAddress: "Sanctioned",
  validationUnavailable: "Unavailable",
  ensDisclaimer: "ENS disclaimer",
};

describe("useEditAddressDialogPresentation", () => {
  it("should expose validation presentation for a valid address entry", () => {
    const addressEntry = createInitialEditAddressEntryState(
      ContactAddressValueSchema.parse("0x1234567890123456789012345678901234567890"),
    );
    const onAddressChange = jest.fn();
    const { result } = renderHook(() =>
      useEditAddressDialogPresentation({
        addressEntry,
        labels,
        onAddressChange,
      }),
    );

    expect(result.current).toMatchObject({
      value: addressEntry.value,
      inputStatus: "success",
      helperText: "Valid",
      showEnsDisclaimer: false,
    });
  });

  it("should prevent default paste and forward the pasted value", () => {
    const addressEntry = {
      status: "valid" as const,
      value: "0x12",
      resolvedAddress: ContactAddressValueSchema.parse(
        "0x1234567890123456789012345678901234567890",
      ),
      inputMethod: "manual" as const,
    };
    const onAddressChange = jest.fn();
    const preventDefault = jest.fn();
    const { result } = renderHook(() =>
      useEditAddressDialogPresentation({
        addressEntry,
        labels,
        onAddressChange,
      }),
    );

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
});
