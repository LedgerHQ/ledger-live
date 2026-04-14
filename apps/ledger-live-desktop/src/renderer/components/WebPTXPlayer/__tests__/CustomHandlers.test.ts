import { createDialogInfoHandler } from "../CustomHandlers";
import {
  getActionDialogSnapshot,
  subscribeActionDialog,
  resolveActionDialog,
  showActionDialog,
} from "../actionDialogStore";
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

describe("action dialog store", () => {
  afterEach(() => {
    // Clean up any pending state between tests
    resolveActionDialog(false);
  });

  it("should start with null snapshot", () => {
    expect(getActionDialogSnapshot()).toBeNull();
  });

  it("should notify subscribers when resolveActionDialog is called", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeActionDialog(listener);

    resolveActionDialog(false);

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("should unsubscribe correctly", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeActionDialog(listener);
    unsubscribe();

    resolveActionDialog(false);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should reset snapshot to null after resolveActionDialog", () => {
    showActionDialog({
      title: "Test",
      description: "Test description",
      ctaLabel: "Confirm",
    });

    expect(getActionDialogSnapshot()).not.toBeNull();

    resolveActionDialog(true);

    expect(getActionDialogSnapshot()).toBeNull();
  });

  it("should notify multiple subscribers", () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsub1 = subscribeActionDialog(listener1);
    const unsub2 = subscribeActionDialog(listener2);

    resolveActionDialog(false);

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    unsub1();
    unsub2();
  });
});
