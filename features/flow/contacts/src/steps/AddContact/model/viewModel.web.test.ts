import { INVALID_CONTACT_NAME_ERROR_NAME } from "@domain/entity-contact";
import { createAddContactViewModel } from "./viewModel";

describe("createAddContactViewModel", () => {
  it("disables save for an empty draft name", () => {
    expect(createAddContactViewModel("")).toEqual({
      draftName: "",
      avatarInitial: "",
      invalidNameError: null,
      isSaveEnabled: false,
    });
  });

  it("enables save for a valid draft name", () => {
    expect(createAddContactViewModel("Ben")).toEqual({
      draftName: "Ben",
      avatarInitial: "B",
      invalidNameError: null,
      isSaveEnabled: true,
    });
  });

  it("exposes the stable invalid name error for an invalid draft name", () => {
    expect(createAddContactViewModel("Olive2")).toEqual({
      draftName: "Olive2",
      avatarInitial: "O",
      invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
      isSaveEnabled: false,
    });
  });

  it("derives the avatar initial from the trimmed draft name", () => {
    expect(createAddContactViewModel("  Ben")).toMatchObject({
      draftName: "  Ben",
      avatarInitial: "B",
      isSaveEnabled: true,
    });
  });

  it("computes the avatar initial from the current draft name", () => {
    expect(createAddContactViewModel("olive").avatarInitial).toBe("O");
    expect(createAddContactViewModel("élodie").avatarInitial).toBe("É");
  });
});
