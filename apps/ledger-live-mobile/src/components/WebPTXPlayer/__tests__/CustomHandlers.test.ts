import {
  createOpenInfoBottomSheetHandler,
  createOpenMenuBottomSheetHandler,
} from "../CustomHandlers";
import { makeSetEarnInfoBottomSheetAction, makeSetEarnMenuBottomSheetAction } from "~/actions/earn";

describe("createOpenInfoBottomSheetHandler", () => {
  it("should dispatch with validated params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "Info title",
        message: "Info message",
        linkText: "Learn more",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "Info title",
        message: "Info message",
        linkText: "Learn more",
        linkHref,
      }),
    );
  });

  it("should propagate validation errors from validateInfoDialogParams", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.info");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should reject disallowed URLs", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(
      handler({
        params: {
          title: "T",
          message: "M",
          linkHref: "https://example.com",
        },
      }),
    ).rejects.toThrow("'linkHref' is not an allowed URL");
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

  it("should dispatch set menu bottom sheet action with params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await handler({ params: menuParams });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(makeSetEarnMenuBottomSheetAction(menuParams));
  });

  it("should throw when params are missing", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.menu");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
