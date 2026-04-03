import { createDialogInfoHandler } from "../CustomHandlers";
import { setPtxInfoDialog } from "~/renderer/reducers/ptxInfoDialog";

describe("createDialogInfoHandler", () => {
  let dispatch: jest.Mock;
  let handler: ReturnType<typeof createDialogInfoHandler>;

  beforeEach(() => {
    dispatch = jest.fn();
    handler = createDialogInfoHandler(dispatch);
  });

  it("should dispatch setPtxInfoDialog with valid params", async () => {
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "Staking info",
        message: "Delegate to earn rewards.",
        linkText: "Learn more",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "Staking info",
        message: "Delegate to earn rewards.",
        linkText: "Learn more",
        linkHref,
      }),
    );
  });

  it("should dispatch without link fields when they are omitted", async () => {
    await handler({ params: { title: "T", message: "M" } });

    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "T",
        message: "M",
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });

  it("should trim title and message before dispatching", async () => {
    await handler({ params: { title: "  padded  ", message: "  spaced  " } });

    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "padded",
        message: "spaced",
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });

  it("should throw when params are missing", async () => {
    await expect(handler({} as Parameters<typeof handler>[0])).rejects.toThrow(
      "Missing params for custom.dialog.info",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when title is not a string", async () => {
    await expect(
      handler({ params: { title: 42 as unknown as string, message: "ok" } }),
    ).rejects.toThrow(
      "Invalid params for custom.dialog.info: expected non-empty string 'title' and 'message'.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when message is not a string", async () => {
    await expect(
      handler({ params: { title: "ok", message: null as unknown as string } }),
    ).rejects.toThrow(
      "Invalid params for custom.dialog.info: expected non-empty string 'title' and 'message'.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when title is empty after trim", async () => {
    await expect(handler({ params: { title: "   ", message: "ok" } })).rejects.toThrow(
      "Invalid params for custom.dialog.info: expected non-empty string 'title' and 'message'.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when message is empty after trim", async () => {
    await expect(handler({ params: { title: "ok", message: "   " } })).rejects.toThrow(
      "Invalid params for custom.dialog.info: expected non-empty string 'title' and 'message'.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when linkText is provided but not a string", async () => {
    await expect(
      handler({
        params: { title: "T", message: "M", linkText: 123 as unknown as string },
      }),
    ).rejects.toThrow(
      "Invalid params for custom.dialog.info: 'linkText' must be a string when provided.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should throw when linkHref is provided but not a string", async () => {
    await expect(
      handler({
        params: { title: "T", message: "M", linkHref: true as unknown as string },
      }),
    ).rejects.toThrow(
      "Invalid params for custom.dialog.info: 'linkHref' must be a string when provided.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should trim linkText to empty string when it is only whitespace", async () => {
    const linkHref = "https://www.ledger.com";

    await handler({
      params: { title: "T", message: "M", linkText: "   ", linkHref },
    });

    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "T",
        message: "M",
        linkText: "",
        linkHref,
      }),
    );
  });

  it("should throw when linkHref fails URL validation", async () => {
    await expect(
      handler({
        params: {
          title: "T",
          message: "M",
          linkText: "Click",
          linkHref: "https://evil.example.com",
        },
      }),
    ).rejects.toThrow(
      "Invalid params for custom.dialog.info: 'linkHref' is not an allowed URL.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should pass through long title and message without truncating", async () => {
    const longTitle = "T".repeat(500);
    const longMessage = "M".repeat(2000);

    await handler({ params: { title: longTitle, message: longMessage } });

    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: longTitle,
        message: longMessage,
        linkText: undefined,
        linkHref: undefined,
      }),
    );
  });
});
