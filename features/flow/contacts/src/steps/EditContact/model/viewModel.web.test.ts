import { ContactNameSchema } from "@domain/entity-contact";
import { createRenameContactViewModel } from "./viewModel";

describe("createRenameContactViewModel", () => {
  it("disables confirm when the draft name matches the current name", () => {
    expect(createRenameContactViewModel("Ada", "Ada").isConfirmEnabled).toBe(false);
  });

  it("enables confirm when the draft name changed and is valid", () => {
    expect(createRenameContactViewModel("Ben", "Ada").isConfirmEnabled).toBe(true);
  });

  it("disables confirm for invalid names", () => {
    expect(createRenameContactViewModel("Ada!", "Ben").isConfirmEnabled).toBe(false);
  });

  it("accepts trimmed valid renames", () => {
    const result = createRenameContactViewModel(
      ContactNameSchema.parse("Charlie"),
      ContactNameSchema.parse("Ada"),
    );

    expect(result.isConfirmEnabled).toBe(true);
    expect(result.invalidNameError).toBeNull();
  });
});
