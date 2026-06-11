import { createDialogInfoHandler } from "../CustomHandlers";
import { resolveActionDialog, createOpenActionDialogHandler } from "../actionDialogStore";
import { setPtxInfoDialog } from "~/renderer/reducers/ptxInfoDialog";
import { setActionDialog } from "~/renderer/reducers/actionDialog";

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

describe("createOpenActionDialogHandler", () => {
  afterEach(() => {
    resolveActionDialog(false);
  });

  it("should dispatch setActionDialog with validated params and return a promise", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({
      params: {
        title: "Swap required",
        description: "You need to swap first",
        ctaLabel: "Go to Swap",
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      setActionDialog({
        title: "Swap required",
        description: "You need to swap first",
        ctaLabel: "Go to Swap",
      }),
    );

    // Resolve the pending dialog
    resolveActionDialog(true);
    const result = await promise;
    expect(result).toEqual({ confirmed: true });
  });

  it("should dismiss previous dialog when opening a new one", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const firstPromise = handler({
      params: {
        title: "First",
        description: "First dialog",
        ctaLabel: "OK",
      },
    });

    const secondPromise = handler({
      params: {
        title: "Second",
        description: "Second dialog",
        ctaLabel: "OK",
      },
    });

    // First dialog should have been auto-dismissed
    const firstResult = await firstPromise;
    expect(firstResult).toEqual({ confirmed: false });

    // Resolve the second dialog
    resolveActionDialog(true);
    const secondResult = await secondPromise;
    expect(secondResult).toEqual({ confirmed: true });
  });

  it("should clear Redux state when resolving", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({
      params: {
        title: "Test",
        description: "Test description",
        ctaLabel: "Confirm",
      },
    });

    resolveActionDialog(true);
    await promise;

    expect(dispatch).toHaveBeenCalledWith(setActionDialog(null));
  });

  it("should propagate validation errors", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    await expect(handler({} as Parameters<typeof handler>[0])).rejects.toThrow(
      "Invalid params for custom.dialog.confirmation: params are required.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});
