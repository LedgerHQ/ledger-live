import { validateActionDialogParams } from "./actionDialogParams";

const HANDLER = "custom.dialog.confirmation";

describe("validateActionDialogParams", () => {
  it("should return validated params for valid input", () => {
    const result = validateActionDialogParams(
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
    const result = validateActionDialogParams(
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
    const result = validateActionDialogParams(
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
      const result = validateActionDialogParams(
        { title: "T", description: "D", ctaLabel: "OK", icon },
        HANDLER,
      );
      expect(result.icon).toBe(icon);
    }
  });

  it("should throw when params are undefined", () => {
    expect(() => validateActionDialogParams(undefined, HANDLER)).toThrow(
      `Missing params for ${HANDLER}`,
    );
  });

  it("should throw when title is not a string", () => {
    expect(() =>
      validateActionDialogParams(
        { title: 42 as unknown as string, description: "D", ctaLabel: "OK" },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when description is not a string", () => {
    expect(() =>
      validateActionDialogParams(
        { title: "T", description: null as unknown as string, ctaLabel: "OK" },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when ctaLabel is not a string", () => {
    expect(() =>
      validateActionDialogParams(
        { title: "T", description: "D", ctaLabel: 99 as unknown as string },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when title is empty after trim", () => {
    expect(() =>
      validateActionDialogParams({ title: "   ", description: "D", ctaLabel: "OK" }, HANDLER),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when description is empty after trim", () => {
    expect(() =>
      validateActionDialogParams({ title: "T", description: "   ", ctaLabel: "OK" }, HANDLER),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when ctaLabel is empty after trim", () => {
    expect(() =>
      validateActionDialogParams({ title: "T", description: "D", ctaLabel: "   " }, HANDLER),
    ).toThrow(`Invalid params for ${HANDLER}`);
  });

  it("should throw when icon is not an allowed value", () => {
    expect(() =>
      validateActionDialogParams(
        { title: "T", description: "D", ctaLabel: "OK", icon: "error" as never },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: 'icon' must be one of`);
  });

  it("should include handlerName in all error messages", () => {
    const custom = "custom.myHandler";
    expect(() => validateActionDialogParams(undefined, custom)).toThrow(custom);
    expect(() =>
      validateActionDialogParams({ title: "   ", description: "D", ctaLabel: "OK" }, custom),
    ).toThrow(custom);
  });
});
