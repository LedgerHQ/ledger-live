import { createAddContactViewModel } from "./viewModel";

describe("createAddContactViewModel", () => {
  it("disables save for an empty draft name", () => {
    expect(createAddContactViewModel("")).toEqual({
      draftName: "",
      avatarInitial: "",
      isSaveEnabled: false,
    });
  });

  it("enables save for a valid draft name", () => {
    expect(createAddContactViewModel("Ben")).toEqual({
      draftName: "Ben",
      avatarInitial: "B",
      isSaveEnabled: true,
    });
  });

  it("disables save for an invalid draft name", () => {
    expect(createAddContactViewModel("Olive2")).toMatchObject({
      draftName: "Olive2",
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
