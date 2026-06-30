import { sanitizeBorrowErrorBottomSheetParams } from "./errorBottomSheetParams";

const HANDLER = "custom.bottomSheet.error";

describe("sanitizeBorrowErrorBottomSheetParams", () => {
  it("trims and returns valid params", () => {
    expect(
      sanitizeBorrowErrorBottomSheetParams(
        { title: "  Title  ", description: "  Desc  ", ctaLabel: "  OK  " },
        HANDLER,
      ),
    ).toEqual({ title: "Title", description: "Desc", ctaLabel: "OK" });
  });

  it("throws when params are missing", () => {
    expect(() => sanitizeBorrowErrorBottomSheetParams(undefined, HANDLER)).toThrow(
      `Invalid params for ${HANDLER}: params are required.`,
    );
  });

  it.each([
    [{ title: 1, description: "d", ctaLabel: "c" }],
    [{ title: "t", description: undefined, ctaLabel: "c" }],
    [{ title: "t", description: "d", ctaLabel: 0 }],
  ])("throws TypeError when a field is not a string (%#)", invalid => {
    expect(() =>
      sanitizeBorrowErrorBottomSheetParams(
        invalid as unknown as Parameters<typeof sanitizeBorrowErrorBottomSheetParams>[0],
        HANDLER,
      ),
    ).toThrow(TypeError);
  });

  it.each([
    [{ title: "  ", description: "d", ctaLabel: "c" }],
    [{ title: "t", description: " ", ctaLabel: "c" }],
    [{ title: "t", description: "d", ctaLabel: "" }],
  ])("throws when a field is empty after trimming (%#)", invalid => {
    expect(() => sanitizeBorrowErrorBottomSheetParams(invalid, HANDLER)).toThrow(
      `Invalid params for ${HANDLER}: 'title', 'description' and 'ctaLabel' must be non-empty.`,
    );
  });
});
