import { sanitizeActionDialogParams } from "./actionDialogParams";

const HANDLER = "custom.dialog.confirmation";

describe("sanitizeActionDialogParams", () => {
  it("should return validated params for valid input", () => {
    const result = sanitizeActionDialogParams(
      {
        title: "Swap required",
        description: "You need to swap before staking",
        ctaLabel: "Go to Swap",
        icon: "warning",
      },
      HANDLER,
    );

    expect(result).toEqual({
      title: "Swap required",
      description: "You need to swap before staking",
      ctaLabel: "Go to Swap",
      icon: "warning",
    });
  });

  it("should return validated params without icon when omitted", () => {
    const result = sanitizeActionDialogParams(
      { title: "T", description: "D", ctaLabel: "OK" },
      HANDLER,
    );

    expect(result).toEqual({
      title: "T",
      description: "D",
      ctaLabel: "OK",
      icon: undefined,
    });
  });

  it("should trim title, description and ctaLabel", () => {
    const result = sanitizeActionDialogParams(
      { title: "  padded  ", description: "  spaced  ", ctaLabel: "  ok  " },
      HANDLER,
    );

    expect(result).toEqual({
      title: "padded",
      description: "spaced",
      ctaLabel: "ok",
      icon: undefined,
    });
  });

  it("should accept all allowed icon values", () => {
    for (const icon of ["info", "warning", "success"] as const) {
      const result = sanitizeActionDialogParams(
        { title: "T", description: "D", ctaLabel: "OK", icon },
        HANDLER,
      );
      expect(result.icon).toBe(icon);
    }
  });

  it.each([
    { field: "title", params: { title: "   ", description: "D", ctaLabel: "OK" } },
    { field: "description", params: { title: "T", description: "   ", ctaLabel: "OK" } },
    { field: "ctaLabel", params: { title: "T", description: "D", ctaLabel: "   " } },
  ])("should throw when $field is empty after trim", ({ params }) => {
    expect(() => sanitizeActionDialogParams(params, HANDLER)).toThrow(
      `Invalid params for ${HANDLER}`,
    );
  });

  it("should throw when icon is not an allowed value", () => {
    expect(() =>
      sanitizeActionDialogParams(
        { title: "T", description: "D", ctaLabel: "OK", icon: "error" as never },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: 'icon' must be one of`);
  });

  it("should include handlerName in all error messages", () => {
    const custom = "custom.myHandler";
    expect(() =>
      sanitizeActionDialogParams({ title: "   ", description: "D", ctaLabel: "OK" }, custom),
    ).toThrow(custom);
  });
});
