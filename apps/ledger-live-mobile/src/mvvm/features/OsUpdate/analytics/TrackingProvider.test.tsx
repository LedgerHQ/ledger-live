import React, { useEffect } from "react";
import { track, trackPage } from "@shared/analytics";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { act, render } from "@tests/test-renderer";
import { TrackingProvider, useOsUpdateTracking } from "./TrackingProvider";
import {
  OsUpdateButton,
  OsUpdateEvent,
  OsUpdateFailureType,
  OsUpdateFlowStep,
  OsUpdatePage,
  OsUpdateRestoreStatus,
  type OsUpdatePageEvent,
} from "./types";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const mockedTrack = jest.mocked(track);
const mockedTrackPage = jest.mocked(trackPage);

const device: Device = {
  id: "id",
  name: null,
  deviceModelId: DeviceModelId.stax,
  transport: rnBleTransportIdentifier,
};
const shared = { platform: "lwm", modelId: DeviceModelId.stax, transport: "ble", mode: "update" };

const preparing: OsUpdatePageEvent = {
  page: OsUpdatePage.PREPARING,
  step: OsUpdateFlowStep.PRE_CHECKS,
};
const deviceLocked: OsUpdatePageEvent = {
  page: OsUpdatePage.DEVICE_LOCKED,
  step: OsUpdateFlowStep.PRE_CHECKS,
};
const installing = (updateIndex: number, updateCount = 2): OsUpdatePageEvent => ({
  page: OsUpdatePage.INSTALLING,
  updateIndex,
  updateCount,
  osVersionTo: "1.8.0",
});
const error: OsUpdatePageEvent = {
  page: OsUpdatePage.ERROR,
  step: OsUpdateFlowStep.APPLY_UPDATES,
  failureType: OsUpdateFailureType.OUT_OF_MEMORY,
};

type Props = Partial<React.ComponentProps<typeof TrackingProvider>>;

function renderProvider(props: Props = {}) {
  const analytics: { current?: ReturnType<typeof useOsUpdateTracking> } = {};
  function Consumer() {
    const value = useOsUpdateTracking();
    useEffect(() => {
      analytics.current = value;
    }, [value]);
    return null;
  }
  const defaultProps = {
    device,
    updateCount: 2,
    osVersionFrom: "1.4.0",
    osVersionTo: "1.8.0",
    isStarted: true,
  };
  const tree = (overrides: Props) => (
    <TrackingProvider {...defaultProps} {...props} {...overrides}>
      <Consumer />
    </TrackingProvider>
  );
  const result = render(tree({}));

  const trackPageEvent = (event: OsUpdatePageEvent) =>
    act(() => analytics.current?.trackPage(event));
  const trackClick = (button: OsUpdateButton) => act(() => analytics.current?.trackClick(button));
  const trackCompleted = (restoreStatus: OsUpdateRestoreStatus) =>
    act(() => analytics.current?.trackCompleted({ page: OsUpdatePage.SUCCESS, restoreStatus }));
  const rerender = (overrides: Props) => result.rerender(tree(overrides));

  return { ...result, trackPage: trackPageEvent, trackClick, trackCompleted, rerender };
}

const outcomes = () =>
  mockedTrack.mock.calls.filter(([event]) =>
    [OsUpdateEvent.COMPLETED, OsUpdateEvent.FAILED, OsUpdateEvent.ABORTED].includes(
      event as OsUpdateEvent,
    ),
  );

const page = (category: OsUpdatePage, props: object = {}) =>
  expect.objectContaining({ category, props: expect.objectContaining(props) });

describe("TrackingProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds the shared properties to page events", () => {
    const { trackPage } = renderProvider();

    trackPage(preparing);

    expect(mockedTrackPage).toHaveBeenCalledWith({
      category: OsUpdatePage.PREPARING,
      props: { step: OsUpdateFlowStep.PRE_CHECKS, ...shared, updateCount: 2 },
    });
  });

  it("sends clicks with the current page", () => {
    const { trackPage, trackClick } = renderProvider();

    trackPage(error);
    trackClick(OsUpdateButton.CANCEL);

    expect(mockedTrack).toHaveBeenLastCalledWith("button_clicked", {
      button: OsUpdateButton.CANCEL,
      page: OsUpdatePage.ERROR,
      step: OsUpdateFlowStep.APPLY_UPDATES,
      failureType: OsUpdateFailureType.OUT_OF_MEMORY,
      ...shared,
      updateCount: 2,
    });
  });

  it("adds the step only on the clicks that carry it", () => {
    const { trackPage, trackClick } = renderProvider();

    trackPage({
      page: OsUpdatePage.SECURE_CONNECTION_REFUSED,
      step: OsUpdateFlowStep.CREATE_BACKUP,
    });
    trackClick(OsUpdateButton.RETRY);
    expect(mockedTrack).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: OsUpdateButton.RETRY,
        step: OsUpdateFlowStep.CREATE_BACKUP,
      }),
    );

    trackPage({ page: OsUpdatePage.SUCCESS, restoreStatus: OsUpdateRestoreStatus.NONE });
    trackClick(OsUpdateButton.CLOSE);
    expect(mockedTrack).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.not.objectContaining({ step: expect.anything() }),
    );
  });

  it("sends screens once, a Preparing page per step and an Installing page per update", () => {
    const { trackPage } = renderProvider();
    const preparingBackup: OsUpdatePageEvent = {
      page: OsUpdatePage.PREPARING,
      step: OsUpdateFlowStep.CREATE_BACKUP,
    };

    trackPage(preparing);
    trackPage(deviceLocked);
    trackPage(preparing);
    trackPage(preparingBackup);
    trackPage(deviceLocked);
    trackPage(preparingBackup);
    trackPage(installing(1));
    trackPage(installing(1));
    trackPage(installing(2));

    expect(mockedTrackPage.mock.calls.map(([payload]) => payload)).toEqual([
      page(OsUpdatePage.PREPARING, { step: OsUpdateFlowStep.PRE_CHECKS }),
      page(OsUpdatePage.DEVICE_LOCKED),
      page(OsUpdatePage.PREPARING, { step: OsUpdateFlowStep.CREATE_BACKUP }),
      page(OsUpdatePage.DEVICE_LOCKED),
      page(OsUpdatePage.INSTALLING, { updateIndex: 1 }),
      page(OsUpdatePage.INSTALLING, { updateIndex: 2 }),
    ]);
  });

  it("sends sheets every time they open, but not twice in a row", () => {
    const { trackPage } = renderProvider();

    trackPage(preparing);
    trackPage(deviceLocked);
    trackPage(deviceLocked);
    trackPage(preparing);
    trackPage(deviceLocked);

    expect(
      mockedTrackPage.mock.calls.filter(
        ([{ category }]) => category === OsUpdatePage.DEVICE_LOCKED,
      ),
    ).toHaveLength(2);
  });

  it("starts a bootloader repair at 0 and takes the count from Installing", () => {
    const { trackPage, trackClick } = renderProvider({
      mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
      updateCount: undefined,
      osVersionTo: undefined,
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      OsUpdateEvent.STARTED,
      expect.objectContaining({
        mode: "bootloaderRepair",
        page: OsUpdatePage.BOOTLOADER_DETECTED,
        updateCount: 0,
      }),
    );

    trackPage(installing(1, 3));
    trackClick(OsUpdateButton.CLOSE);

    expect(mockedTrackPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ updateCount: 3 }),
      }),
    );
    expect(mockedTrack).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({ mode: "bootloaderRepair", updateCount: 3 }),
    );
  });

  it("sends Installing again when a bootloader repair resolves its update path", () => {
    const { trackPage } = renderProvider({
      mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
      updateCount: undefined,
      osVersionTo: undefined,
    });

    trackPage(installing(1, 1));
    trackPage(installing(1, 5));
    trackPage(installing(1, 5));

    expect(mockedTrackPage.mock.calls.map(([payload]) => payload)).toEqual([
      page(OsUpdatePage.INSTALLING, { updateIndex: 1, updateCount: 1 }),
      page(OsUpdatePage.INSTALLING, { updateIndex: 1, updateCount: 5 }),
    ]);
  });

  it("keeps updateCount at 0 for a restore", () => {
    const { trackPage, trackClick } = renderProvider({
      mode: OsUpdateFlowMode.RESTORE_BACKUP,
      updateCount: 2,
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      OsUpdateEvent.STARTED,
      expect.objectContaining({
        mode: "restoreBackup",
        page: OsUpdatePage.RESTORE_CONFIRMATION,
        updateCount: 0,
      }),
    );

    trackPage(installing(1, 3));
    trackClick(OsUpdateButton.CLOSE);

    expect(mockedTrackPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ updateCount: 0 }),
      }),
    );
    expect(mockedTrack).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({ mode: "restoreBackup", updateCount: 0 }),
    );
  });

  it("sends the start once, with the page it starts from", () => {
    const { trackPage, rerender } = renderProvider({ isStarted: false });
    trackPage({ page: OsUpdatePage.WHATS_NEW, osVersionTo: "1.8.0" });
    expect(mockedTrack).not.toHaveBeenCalled();

    rerender({ isStarted: true });
    rerender({ isStarted: true });

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith(OsUpdateEvent.STARTED, {
      page: OsUpdatePage.WHATS_NEW,
      osVersionFrom: "1.4.0",
      osVersionTo: "1.8.0",
      ...shared,
      updateCount: 2,
    });
  });

  it("completes on the Success page, and sends nothing more on unmount", () => {
    const { trackPage, unmount } = renderProvider();

    trackPage(installing(2));
    trackPage({ page: OsUpdatePage.SUCCESS, restoreStatus: OsUpdateRestoreStatus.PARTIAL });
    unmount();

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.COMPLETED,
        {
          page: OsUpdatePage.SUCCESS,
          restoreStatus: OsUpdateRestoreStatus.PARTIAL,
          osVersionTo: "1.8.0",
          ...shared,
          updateCount: 2,
        },
      ],
    ]);
  });

  it("fails when it unmounts on the Error page", () => {
    const { trackPage, unmount } = renderProvider();

    trackPage(installing(1));
    trackPage(error);
    unmount();

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.FAILED,
        {
          page: OsUpdatePage.ERROR,
          step: OsUpdateFlowStep.APPLY_UPDATES,
          failureType: OsUpdateFailureType.OUT_OF_MEMORY,
          updateIndex: 1,
          ...shared,
          updateCount: 2,
        },
      ],
    ]);
  });

  it("completes before the Success page shows, and sends it only once", () => {
    const { trackPage, trackCompleted, unmount } = renderProvider();

    trackPage(installing(2));
    trackCompleted(OsUpdateRestoreStatus.FULL);
    unmount();

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.COMPLETED,
        {
          page: OsUpdatePage.SUCCESS,
          restoreStatus: OsUpdateRestoreStatus.FULL,
          osVersionTo: "1.8.0",
          ...shared,
          updateCount: 2,
        },
      ],
    ]);
  });

  it("fails when it is closed from the confirmation opened on the Error page", () => {
    const { trackPage, unmount } = renderProvider();

    trackPage(installing(1));
    trackPage(error);
    trackPage({ page: OsUpdatePage.CLOSE_CONFIRMATION, step: OsUpdateFlowStep.APPLY_UPDATES });
    unmount();

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.FAILED,
        {
          page: OsUpdatePage.ERROR,
          step: OsUpdateFlowStep.APPLY_UPDATES,
          failureType: OsUpdateFailureType.OUT_OF_MEMORY,
          updateIndex: 1,
          ...shared,
          updateCount: 2,
        },
      ],
    ]);
  });

  it("aborts when it unmounts on any other page", () => {
    const { trackPage, unmount } = renderProvider();

    trackPage(preparing);
    trackPage({ page: OsUpdatePage.CLOSE_CONFIRMATION, step: OsUpdateFlowStep.PRE_CHECKS });
    unmount();

    expect(outcomes()).toEqual([
      [
        OsUpdateEvent.ABORTED,
        {
          page: OsUpdatePage.CLOSE_CONFIRMATION,
          step: OsUpdateFlowStep.PRE_CHECKS,
          updateIndex: undefined,
          ...shared,
          updateCount: 2,
        },
      ],
    ]);
  });

  it("sends no outcome when the flow never started", () => {
    const { trackPage, unmount } = renderProvider({ isStarted: false });

    trackPage({ page: OsUpdatePage.WHATS_NEW, osVersionTo: "1.8.0" });
    unmount();

    expect(mockedTrack).not.toHaveBeenCalled();
  });
});
