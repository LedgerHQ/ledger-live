import { ContactAddressLabelSchema } from "@domain/entity-contact";
import { createRenameAddressViewModel } from "./viewModel";

describe("createRenameAddressViewModel", () => {
  const currentLabel = "Ethereum";
  const existingLabels = [ContactAddressLabelSchema.parse("Polygon")];

  it("should enable confirm when the label changed and is valid", () => {
    expect(createRenameAddressViewModel("Main ETH", currentLabel, existingLabels)).toEqual({
      draftLabel: "Main ETH",
      invalidLabelError: null,
      isConfirmEnabled: true,
    });
  });

  it("should disable confirm when the label is unchanged", () => {
    expect(createRenameAddressViewModel(currentLabel, currentLabel, existingLabels)).toEqual({
      draftLabel: currentLabel,
      invalidLabelError: null,
      isConfirmEnabled: false,
    });
  });

  it("should expose duplicate label validation errors", () => {
    expect(
      createRenameAddressViewModel("Polygon", currentLabel, existingLabels).invalidLabelError,
    ).toBe("DuplicateContactAddressLabelError");
  });
});
