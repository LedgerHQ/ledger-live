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

  it("should dispatch with minimal required params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const params = { title: "T", message: "M" };

    await handler({ params });

    expect(dispatch).toHaveBeenCalledWith(makeSetEarnInfoBottomSheetAction(params));
  });

  it("should throw when params are missing", async () => {
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
