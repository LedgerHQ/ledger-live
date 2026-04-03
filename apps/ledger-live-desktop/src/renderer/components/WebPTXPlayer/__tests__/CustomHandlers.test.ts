import { createDialogInfoHandler } from "../CustomHandlers";
import { setPtxInfoDialog } from "~/renderer/reducers/ptxInfoDialog";

describe("createDialogInfoHandler", () => {
  it("should dispatch setPtxInfoDialog with validated params", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await handler({
      params: {
        title: "Staking info",
        message: "Delegate to earn.",
        linkText: "Learn more",
        linkHref: "https://www.ledger.com",
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "Staking info",
        message: "Delegate to earn.",
        linkText: "Learn more",
        linkHref: "https://www.ledger.com",
      }),
    );
  });

  it("should propagate validation errors from validateInfoDialogParams", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await expect(handler({} as Parameters<typeof handler>[0])).rejects.toThrow(
      "Missing params for custom.dialog.info",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should reject disallowed URLs", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await expect(
      handler({
        params: {
          title: "T",
          message: "M",
          linkHref: "https://evil.example.com",
        },
      }),
    ).rejects.toThrow("'linkHref' is not an allowed URL");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
