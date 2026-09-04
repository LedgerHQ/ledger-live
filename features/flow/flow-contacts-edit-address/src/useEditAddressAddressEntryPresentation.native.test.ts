import { act, renderHook } from "@testing-library/react-native";
import { ContactAddressValueSchema } from "@domain/entity-contact";
import { createInitialEditAddressEntryState } from "./model/addressEntryValidation";
import { useEditAddressAddressEntryPresentation } from "./useEditAddressAddressEntryPresentation.native";

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

describe("useEditAddressAddressEntryPresentation", () => {
  it("should expose validation presentation for a valid address entry", () => {
    const currentAddress = createInitialEditAddressEntryState(
      ContactAddressValueSchema.parse("0x1234567890123456789012345678901234567890"),
    );
    const onAddressChange = jest.fn();
    const { result } = renderHook(() =>
      useEditAddressAddressEntryPresentation({
        addressEntry: currentAddress,
        labels,
        onAddressChange,
      }),
    );

    expect(result.current).toMatchObject({
      value: currentAddress.value,
      inputStatus: "success",
      helperText: "Valid",
      showEnsDisclaimer: false,
    });
  });

  it("should classify multi-character native edits as paste", () => {
    const currentAddress = createInitialEditAddressEntryState(
      ContactAddressValueSchema.parse("0x1234567890123456789012345678901234567890"),
    );
    const onAddressChange = jest.fn();
    const { result } = renderHook(() =>
      useEditAddressAddressEntryPresentation({
        addressEntry: currentAddress,
        labels,
        onAddressChange,
      }),
    );

    act(() => {
      result.current.onChangeText("0x1234567890123456789012345678901234567891");
    });

    expect(onAddressChange).toHaveBeenCalledWith(
      "0x1234567890123456789012345678901234567891",
      "manual",
    );

    act(() => {
      result.current.onChangeText("0xpasted1234567890123456789012345678901234567890");
    });

    expect(onAddressChange).toHaveBeenLastCalledWith(
      "0xpasted1234567890123456789012345678901234567890",
      "paste",
    );
  });
});
