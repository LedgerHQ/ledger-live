import {
  createOpenInfoBottomSheetHandler,
  createOpenMenuBottomSheetHandler,
} from "../CustomHandlers";
import { makeSetEarnInfoBottomSheetAction, makeSetEarnMenuBottomSheetAction } from "~/actions/earn";

describe("createOpenInfoBottomSheetHandler", () => {
  it("should dispatch set info bottom sheet action with params when params are provided", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const params = {
      title: "Info title",
      message: "Info message",
      linkText: "Learn more",
      linkHref: "https://example.com",
    };

    await handler({ params });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(makeSetEarnInfoBottomSheetAction(params));
  });

  it("should pass through long title and message without truncating (React text escaping handles display)", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const params = { title: "T", message: "M" };

    await handler({ params });

    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: longTitle,
        message: longMessage,
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });

  it("should throw when title or message is empty after trim", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({ params: { title: "   ", message: "ok" } })).rejects.toThrow(
      "Invalid params for custom.bottomSheet.info: expected non-empty string 'title' and 'message'.",
    );

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should trim linkText and omit when only whitespace", async () => {
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
        linkText: "L".repeat(60),
        linkHref,
      }),
    );

    dispatch.mockClear();
    await handler({
      params: {
        title: "T",
        message: "M",
        linkText: "   ",
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
});

describe("createOpenMenuBottomSheetHandler", () => {
  const menuParams = [
    {
      icon: "Plus",
      label: "Deposit",
      metadata: {
        button: "earn",
        live_app: "earn",
        flow: "deposit",
        link: "ledgerlive://earn",
      },
    },
  ];

  it("should dispatch set menu bottom sheet action with params when params are provided", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await handler({ params: menuParams });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(makeSetEarnMenuBottomSheetAction(menuParams));
  });

  it("should dispatch when a single-option menu array is provided", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);
    const params = [
      {
        icon: "Settings",
        label: "A",
        metadata: { button: "b", live_app: "earn", flow: "f" },
      },
    ];

    await handler({ params });

    expect(dispatch).toHaveBeenCalledWith(makeSetEarnMenuBottomSheetAction(params));
  });

  it("should throw when params are missing", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.menu");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
