import { createOpenInfoBottomSheetHandler } from "../CustomHandlers";
import { makeSetEarnInfoBottomSheetAction } from "~/actions/earn";

describe("createOpenInfoBottomSheetHandler", () => {
  it("should dispatch makeSetEarnInfoBottomSheetAction with title and message when params are provided", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await handler({
      params: { title: "Earn info title", message: "Earn info message body" },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "Earn info title",
        message: "Earn info message body",
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });

  it("should sanitize title and message (strip tags, cap length) before dispatch", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const longTitle = `${"a".repeat(120)}<b>x</b>`;
    const longMessage = `${"m".repeat(800)}<script>x</script>`;

    await handler({
      params: {
        title: longTitle,
        message: longMessage,
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: `${"a".repeat(100)}`,
        message: `${"m".repeat(700)}`,
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });

  it("should throw when title or message is empty after sanitization", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({ params: { title: "   ", message: "ok" } })).rejects.toThrow(
      "Invalid params for custom.bottomSheet.info: expected non-empty string 'title' and 'message'.",
    );
    await expect(handler({ params: { title: "<p></p>", message: "ok" } })).rejects.toThrow(
      "Invalid params for custom.bottomSheet.info: expected non-empty string 'title' and 'message'.",
    );

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should sanitize linkText length and omit when only markup remains", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "T",
        message: "M",
        linkText: `${"L".repeat(60)}`,
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "T",
        message: "M",
        linkText: "L".repeat(50),
        linkHref,
      }),
    );

    dispatch.mockClear();
    await handler({
      params: {
        title: "T",
        message: "M",
        linkText: "<i></i>",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "T",
        message: "M",
        linkText: undefined,
        linkHref,
      }),
    );
  });

  it("should dispatch with linkText and validated linkHref when optional link fields are valid", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "Title",
        message: "Message",
        linkText: "Learn more",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "Title",
        message: "Message",
        linkText: "Learn more",
        linkHref,
      }),
    );
  });

  it("should throw and not dispatch when linkHref fails validateUrl (non-allowlisted domain)", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(
      handler({
        params: {
          title: "Title",
          message: "Message",
          linkText: "Learn more",
          linkHref: "https://example.com",
        },
      }),
    ).rejects.toThrow(
      "Invalid params for custom.bottomSheet.info: 'linkHref' is not an allowed URL.",
    );

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw and not dispatch when no params are provided", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.info");

    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([
    {
      params: { title: 123, message: "Earn info message" },
      description: "title is not a string",
      expectedError:
        "Invalid params for custom.bottomSheet.info: expected non-empty string 'title' and 'message'.",
    },
    {
      params: { title: "Earn info title", message: true },
      description: "message is not a string",
      expectedError:
        "Invalid params for custom.bottomSheet.info: expected non-empty string 'title' and 'message'.",
    },
    {
      params: { title: "Title", message: "Message", linkText: 42 },
      description: "linkText is provided but not a string",
      expectedError:
        "Invalid params for custom.bottomSheet.info: 'linkText' must be a string when provided.",
    },
    {
      params: { title: "Title", message: "Message", linkHref: {} },
      description: "linkHref is provided but not a string",
      expectedError:
        "Invalid params for custom.bottomSheet.info: 'linkHref' must be a string when provided.",
    },
  ])("should throw and not dispatch when $description", async ({ params, expectedError }) => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({ params })).rejects.toThrow(expectedError);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
