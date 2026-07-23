import { promisifyUiHandler, type UiCallbacks } from "../promisifyUiHandler";

describe("promisifyUiHandler", () => {
  it("resolves with the UI result and calls onSuccess once", async () => {
    let captured: UiCallbacks<string> | undefined;
    const onSuccess = jest.fn();
    const onFail = jest.fn();

    const promise = promisifyUiHandler<string>({
      invokeUi: cb => {
        captured = cb;
      },
      onSuccess,
      onFail,
    });

    captured!.onSuccess("ok");

    await expect(promise).resolves.toBe("ok");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("applies mapResult to the resolved value", async () => {
    let captured: UiCallbacks<string> | undefined;

    const promise = promisifyUiHandler<string, number>({
      invokeUi: cb => {
        captured = cb;
      },
      mapResult: value => value.length,
    });

    captured!.onSuccess("hello");

    await expect(promise).resolves.toBe(5);
  });

  it("rejects with the error and calls onFail on error", async () => {
    let captured: UiCallbacks<string> | undefined;
    const onSuccess = jest.fn();
    const onFail = jest.fn();
    const error = new Error("boom");

    const promise = promisifyUiHandler<string>({
      invokeUi: cb => {
        captured = cb;
      },
      onSuccess,
      onFail,
    });

    captured!.onError(error);

    await expect(promise).rejects.toBe(error);
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("rejects with the default cancel error on cancel", async () => {
    let captured: UiCallbacks<string> | undefined;
    const onFail = jest.fn();

    const promise = promisifyUiHandler<string>({
      invokeUi: cb => {
        captured = cb;
      },
      onFail,
    });

    captured!.onCancel();

    await expect(promise).rejects.toThrow("User cancelled");
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("rejects with a custom cancelError on cancel", async () => {
    let captured: UiCallbacks<string> | undefined;
    const customError = new Error("refused on device");

    const promise = promisifyUiHandler<string>({
      invokeUi: cb => {
        captured = cb;
      },
      cancelError: () => customError,
    });

    captured!.onCancel();

    await expect(promise).rejects.toBe(customError);
  });

  it("settles only once — later callbacks are ignored", async () => {
    let captured: UiCallbacks<string> | undefined;
    const onSuccess = jest.fn();
    const onFail = jest.fn();

    const promise = promisifyUiHandler<string>({
      invokeUi: cb => {
        captured = cb;
      },
      onSuccess,
      onFail,
    });

    captured!.onSuccess("first");
    captured!.onSuccess("second");
    captured!.onError(new Error("late error"));
    captured!.onCancel();

    await expect(promise).resolves.toBe("first");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onFail).not.toHaveBeenCalled();
  });
});
