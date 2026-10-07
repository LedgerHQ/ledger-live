import React, { useContext } from "react";
import { updater } from "~/renderer/bridge";
import type { UpdaterStatusEvent } from "~/bridge/contract";
import { act, render, screen } from "tests/testSetup";
import { UpdaterContext, UpdaterProvider } from "./UpdaterContext";

const Consumer = () => {
  const context = useContext(UpdaterContext);
  return (
    <>
      <span data-testid="status">{context?.status}</span>
      <span data-testid="progress">{context?.downloadProgress}</span>
      <span data-testid="version">{context?.version ?? "none"}</span>
      <button onClick={context?.quitAndInstall}>install</button>
    </>
  );
};

const renderProvider = () => {
  const unsubscribe = jest.fn();
  let emit: ((event: UpdaterStatusEvent) => void) | undefined;
  jest.mocked(updater.onStatus).mockImplementation(callback => {
    emit = callback;
    return unsubscribe;
  });
  const view = render(
    <UpdaterProvider>
      <Consumer />
    </UpdaterProvider>,
  );
  return { ...view, unsubscribe, emit: (event: UpdaterStatusEvent) => act(() => emit?.(event)) };
};

describe("UpdaterProvider", () => {
  it("should start idle and init the updater outside dev", () => {
    renderProvider();

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(updater.init).toHaveBeenCalledTimes(1);
  });

  it("should round the download progress", () => {
    const { emit } = renderProvider();

    emit({ status: "download-progress", payload: { percent: 42.6 } });

    expect(screen.getByTestId("status")).toHaveTextContent("download-progress");
    expect(screen.getByTestId("progress")).toHaveTextContent("43");
  });

  it("should keep the version of an available update", () => {
    const { emit } = renderProvider();

    emit({ status: "update-available", payload: { version: "2.0.0" } });

    expect(screen.getByTestId("status")).toHaveTextContent("update-available");
    expect(screen.getByTestId("version")).toHaveTextContent("2.0.0");
  });

  it("should take any other status as is", () => {
    const { emit } = renderProvider();

    emit({ status: "error" });

    expect(screen.getByTestId("status")).toHaveTextContent("error");
  });

  it("should forward quitAndInstall to the bridge", async () => {
    const { user } = renderProvider();

    await user.click(screen.getByRole("button", { name: "install" }));

    expect(updater.quitAndInstall).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe on unmount", () => {
    const { unmount, unsubscribe } = renderProvider();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
