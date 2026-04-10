import { validateInfoDialogParams } from "./validateInfoDialogParams";

const HANDLER = "custom.test.info";

describe("validateInfoDialogParams", () => {
  it("should return validated params for valid input", () => {
    const result = validateInfoDialogParams(
      {
        title: "Staking info",
        message: "Delegate to earn.",
        linkText: "Learn more",
        linkHref: "https://www.ledger.com",
      },
      HANDLER,
    );

    expect(result).toEqual({
      title: "Staking info",
      message: "Delegate to earn.",
      linkText: "Learn more",
      linkHref: "https://www.ledger.com",
    });
  });

  it("should return validated params without link fields when omitted", () => {
    const result = validateInfoDialogParams({ title: "T", message: "M" }, HANDLER);

    expect(result).toEqual({
      title: "T",
      message: "M",
      linkText: undefined,
      linkHref: undefined,
    });
  });

  it("should trim title and message", () => {
    const result = validateInfoDialogParams(
      { title: "  padded  ", message: "  spaced  " },
      HANDLER,
    );

    expect(result).toEqual({
      title: "padded",
      message: "spaced",
      linkText: undefined,
      linkHref: undefined,
    });
  });

  it("should set linkText to undefined when it is only whitespace", () => {
    const result = validateInfoDialogParams(
      { title: "T", message: "M", linkText: "   ", linkHref: "https://www.ledger.com" },
      HANDLER,
    );

    expect(result.linkText).toBeUndefined();
    expect(result.linkHref).toBe("https://www.ledger.com");
  });

  it("should pass through long strings without truncating", () => {
    const longTitle = "T".repeat(500);
    const longMessage = "M".repeat(2000);
    const result = validateInfoDialogParams(
      { title: longTitle, message: longMessage },
      HANDLER,
    );

    expect(result.title).toBe(longTitle);
    expect(result.message).toBe(longMessage);
  });

  it("should throw when params are undefined", () => {
    expect(() => validateInfoDialogParams(undefined, HANDLER)).toThrow(
      `Missing params for ${HANDLER}`,
    );
  });

  it("should throw when title is not a string", () => {
    expect(() =>
      validateInfoDialogParams(
        { title: 42 as unknown as string, message: "ok" },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: expected non-empty string 'title' and 'message'.`);
  });

  it("should throw when message is not a string", () => {
    expect(() =>
      validateInfoDialogParams(
        { title: "ok", message: null as unknown as string },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: expected non-empty string 'title' and 'message'.`);
  });

  it("should throw when title is empty after trim", () => {
    expect(() =>
      validateInfoDialogParams({ title: "   ", message: "ok" }, HANDLER),
    ).toThrow(`Invalid params for ${HANDLER}: expected non-empty string 'title' and 'message'.`);
  });

  it("should throw when message is empty after trim", () => {
    expect(() =>
      validateInfoDialogParams({ title: "ok", message: "   " }, HANDLER),
    ).toThrow(`Invalid params for ${HANDLER}: expected non-empty string 'title' and 'message'.`);
  });

  it("should throw when linkText is provided but not a string", () => {
    expect(() =>
      validateInfoDialogParams(
        { title: "T", message: "M", linkText: 123 as unknown as string },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: 'linkText' must be a string when provided.`);
  });

  it("should throw when linkHref is provided but not a string", () => {
    expect(() =>
      validateInfoDialogParams(
        { title: "T", message: "M", linkHref: true as unknown as string },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: 'linkHref' must be a string when provided.`);
  });

  it("should throw when linkHref fails URL validation", () => {
    expect(() =>
      validateInfoDialogParams(
        { title: "T", message: "M", linkHref: "https://evil.example.com" },
        HANDLER,
      ),
    ).toThrow(`Invalid params for ${HANDLER}: 'linkHref' is not an allowed URL.`);
  });

  it("should include handlerName in all error messages", () => {
    const custom = "custom.myHandler";
    expect(() => validateInfoDialogParams(undefined, custom)).toThrow(custom);
    expect(() =>
      validateInfoDialogParams({ title: "   ", message: "ok" }, custom),
    ).toThrow(custom);
  });
});
