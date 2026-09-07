import { ContactAddressLabelSchema, ContactAddressValueSchema } from "@domain/entity-contact";
import { createInitialEditAddressEntryState } from "./addressEntryValidation";
import { createRenameAddressViewModel } from "./viewModel";

describe("createRenameAddressViewModel", () => {
  const currentLabel = "Ethereum";
  const currentAddress = ContactAddressValueSchema.parse(
    "0x1234567890123456789012345678901234567890",
  );
  const existingLabels = [ContactAddressLabelSchema.parse("Polygon")];
  const validAddressEntry = createInitialEditAddressEntryState(currentAddress);

  it("should enable confirm when the label changed and is valid", () => {
    expect(
      createRenameAddressViewModel(
        "Main ETH",
        currentLabel,
        currentAddress,
        validAddressEntry,
        existingLabels,
      ),
    ).toEqual({
      draftLabel: "Main ETH",
      invalidLabelError: null,
      isConfirmEnabled: true,
    });
  });

  it("should enable confirm when the address changed and is valid", () => {
    const updatedAddressEntry = createInitialEditAddressEntryState(
      ContactAddressValueSchema.parse("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
    );

    expect(
      createRenameAddressViewModel(
        currentLabel,
        currentLabel,
        currentAddress,
        updatedAddressEntry,
        existingLabels,
      ),
    ).toEqual({
      draftLabel: currentLabel,
      invalidLabelError: null,
      isConfirmEnabled: true,
    });
  });

  it("should disable confirm when the label and address are unchanged", () => {
    expect(
      createRenameAddressViewModel(
        currentLabel,
        currentLabel,
        currentAddress,
        validAddressEntry,
        existingLabels,
      ),
    ).toEqual({
      draftLabel: currentLabel,
      invalidLabelError: null,
      isConfirmEnabled: false,
    });
  });

  it("should disable confirm when the address is invalid", () => {
    expect(
      createRenameAddressViewModel(
        currentLabel,
        currentLabel,
        currentAddress,
        {
          status: "invalid",
          value: "invalid-address",
          resolvedAddress: null,
          inputMethod: "manual",
          error: "invalid_format",
        },
        existingLabels,
      ).isConfirmEnabled,
    ).toBe(false);
  });

  it("should expose duplicate label validation errors", () => {
    expect(
      createRenameAddressViewModel(
        "Polygon",
        currentLabel,
        currentAddress,
        validAddressEntry,
        existingLabels,
      ).invalidLabelError,
    ).toBe("DuplicateContactAddressLabelError");
  });
});
