import { createOpenBorrowInfoBottomSheetHandler } from "../borrowDialogHandlers";
import { makeSetBorrowInfoBottomSheetAction } from "~/actions/borrow";

describe("createOpenBorrowInfoBottomSheetHandler", () => {
  it("should dispatch with validated params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenBorrowInfoBottomSheetHandler(dispatch);
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "Borrow info title",
        message: "Borrow info message",
        linkText: "Learn more",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      makeSetBorrowInfoBottomSheetAction({
        title: "Borrow info title",
        message: "Borrow info message",
        linkText: "Learn more",
        linkHref,
      }),
    );
  });

  it("should propagate validation errors from validateInfoDialogParams", async () => {
    const dispatch = jest.fn();
    const handler = createOpenBorrowInfoBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.info");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should reject disallowed URLs", async () => {
    const dispatch = jest.fn();
    const handler = createOpenBorrowInfoBottomSheetHandler(dispatch);

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
