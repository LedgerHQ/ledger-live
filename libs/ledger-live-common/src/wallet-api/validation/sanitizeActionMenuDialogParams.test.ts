import { sanitizeActionMenuDialogParams } from "./actionMenuDialogParams";

const HANDLER = "custom.dialog.menu";

describe("sanitizeActionMenuDialogParams", () => {
  it("returns trimmed options for valid input", () => {
    const result = sanitizeActionMenuDialogParams(
      {
        options: [
          { id: " earn_more ", label: " Earn more ", icon: "deposit" },
          { id: "withdraw_all", label: "Withdraw all", icon: "withdraw" },
        ],
      },
      HANDLER,
    );

    expect(result).toEqual({
      options: [
        { id: "earn_more", label: "Earn more", icon: "deposit" },
        { id: "withdraw_all", label: "Withdraw all", icon: "withdraw" },
      ],
    });
  });

  it.each([undefined, {}, { options: "nope" }, { options: [] }])(
    "throws when options are missing or empty (%j)",
    params => {
      expect(() => sanitizeActionMenuDialogParams(params as never, HANDLER)).toThrow(
        `Invalid params for ${HANDLER}`,
      );
    },
  );

  it("throws when there are too many options", () => {
    const options = Array.from({ length: 6 }, (_, i) => ({
      id: `o${i}`,
      label: "L",
      icon: "deposit" as const,
    }));

    expect(() => sanitizeActionMenuDialogParams({ options }, HANDLER)).toThrow("between 1 and 5");
  });

  it("throws when option ids are duplicated once trimmed", () => {
    const options = [
      { id: "withdraw", label: "A", icon: "withdraw" as const },
      { id: " withdraw ", label: "B", icon: "deposit" as const },
    ];

    expect(() => sanitizeActionMenuDialogParams({ options }, HANDLER)).toThrow("must be unique");
  });

  it.each([
    [{ id: 1, label: "L", icon: "deposit" }],
    [{ id: "  ", label: "L", icon: "deposit" }],
    [{ id: "a", label: "  ", icon: "deposit" }],
    [{ id: "a", label: "L", icon: "unknown" }],
    [{ id: "a", label: "L" }],
    [null],
  ])("throws for an invalid option (%j)", option => {
    expect(() => sanitizeActionMenuDialogParams({ options: [option as never] }, HANDLER)).toThrow(
      `Invalid params for ${HANDLER}`,
    );
  });
});
