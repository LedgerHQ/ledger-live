import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { track, trackPage as trackPageEvent } from "@shared/analytics";
import { rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { getSharedAnalytics } from "./getSharedAnalytics";
import {
  OsUpdateButton,
  OsUpdateEvent,
  OsUpdatePage,
  type OsUpdateFlowStep,
  type OsUpdatePageEvent,
} from "./types";

type OsUpdateTracking = {
  trackPage: (event: OsUpdatePageEvent) => void;
  trackClick: (button: OsUpdateButton) => void;
};

const OsUpdateTrackingContext = createContext<OsUpdateTracking>({
  trackPage: () => {},
  trackClick: () => {},
});

export const useOsUpdateTracking = () => useContext(OsUpdateTrackingContext);

type TrackingProviderProps = Readonly<{
  device: Device;
  mode?: OsUpdateFlowMode;
  updateCount?: number;
  osVersionFrom?: string;
  osVersionTo?: string;
  isStarted: boolean;
  children: ReactNode;
}>;

function getScreenKey(event: OsUpdatePageEvent): string | undefined {
  switch (event.page) {
    case OsUpdatePage.PREPARING:
      return `${event.page}#${event.step}`;
    case OsUpdatePage.INSTALLING:
      return `${event.page}#${event.updateIndex}/${event.updateCount}`;
    case OsUpdatePage.WHATS_NEW:
    case OsUpdatePage.RESTORING:
    case OsUpdatePage.SUCCESS:
      return event.page;
    default:
      return undefined;
  }
}

function getPageProperties({ page: _page, ...properties }: OsUpdatePageEvent) {
  return properties;
}

function getStep(event: OsUpdatePageEvent | undefined): OsUpdateFlowStep | undefined {
  if (!event || !("step" in event)) return undefined;
  return event.step;
}

function getStartPage(
  mode: OsUpdateFlowMode | undefined,
  currentPage: OsUpdatePage | undefined,
): OsUpdatePage | undefined {
  switch (mode) {
    case OsUpdateFlowMode.BOOTLOADER_REPAIR:
      return OsUpdatePage.BOOTLOADER_DETECTED;
    case OsUpdateFlowMode.RESTORE_BACKUP:
      return OsUpdatePage.RESTORE_CONFIRMATION;
    case undefined:
      return currentPage;
    default: {
      const unhandled: never = mode;
      return unhandled;
    }
  }
}

function getUpdateCount(
  mode: OsUpdateFlowMode | undefined,
  updateCount: number | undefined,
  learntUpdateCount: number | undefined,
): number | undefined {
  switch (mode) {
    case OsUpdateFlowMode.BOOTLOADER_REPAIR:
      return learntUpdateCount ?? 0;
    case OsUpdateFlowMode.RESTORE_BACKUP:
      return 0;
    case undefined:
      return updateCount;
    default: {
      const unhandled: never = mode;
      return unhandled;
    }
  }
}

function isSamePageEvent(a: OsUpdatePageEvent | undefined, b: OsUpdatePageEvent): boolean {
  if (!a || a.page !== b.page) return false;
  const aProperties: Record<string, unknown> = getPageProperties(a);
  const bProperties: Record<string, unknown> = getPageProperties(b);
  const keys = new Set([...Object.keys(aProperties), ...Object.keys(bProperties)]);
  return [...keys].every(key => aProperties[key] === bProperties[key]);
}

export function TrackingProvider({
  device,
  mode,
  updateCount,
  osVersionFrom,
  osVersionTo,
  isStarted,
  children,
}: TrackingProviderProps) {
  const inputRef = useRef({ device, mode, updateCount, osVersionFrom, osVersionTo });
  useLayoutEffect(() => {
    inputRef.current = { device, mode, updateCount, osVersionFrom, osVersionTo };
  }, [device, mode, updateCount, osVersionFrom, osVersionTo]);

  const currentPageRef = useRef<OsUpdatePageEvent | undefined>(undefined);
  const sentScreensRef = useRef(new Set<string>());
  const learntUpdateCountRef = useRef<number | undefined>(undefined);
  const lastUpdateIndexRef = useRef<number | undefined>(undefined);
  const lastOsVersionToRef = useRef<string | undefined>(undefined);
  const isStartedRef = useRef(false);
  const hasOutcomeRef = useRef(false);

  const getSharedProperties = useCallback(() => {
    const { device, mode, updateCount } = inputRef.current;
    return getSharedAnalytics({
      modelId: device.deviceModelId,
      wired: device.transport === rnHidTransportIdentifier,
      mode,
      updateCount: getUpdateCount(mode, updateCount, learntUpdateCountRef.current),
    });
  }, []);

  const getOutcomeProperties = useCallback(
    (event: OsUpdateEvent) => {
      const currentPage = currentPageRef.current;
      return {
        page: currentPage?.page,
        ...(currentPage ? getPageProperties(currentPage) : {}),
        ...(event === OsUpdateEvent.FAILED
          ? {
              step: currentPage?.page === OsUpdatePage.ERROR ? currentPage.step : undefined,
              updateIndex: lastUpdateIndexRef.current,
              failureType:
                currentPage?.page === OsUpdatePage.ERROR ? currentPage.failureType : undefined,
              subError: currentPage?.page === OsUpdatePage.ERROR ? currentPage.subError : undefined,
            }
          : {}),
        ...(event === OsUpdateEvent.ABORTED
          ? { step: getStep(currentPage), updateIndex: lastUpdateIndexRef.current }
          : {}),
        ...getSharedProperties(),
      };
    },
    [getSharedProperties],
  );

  const trackOutcome = useCallback(
    (event: OsUpdateEvent, properties: Record<string, unknown> = {}) => {
      if (!isStartedRef.current || hasOutcomeRef.current) return;
      hasOutcomeRef.current = true;
      track(event, { ...getOutcomeProperties(event), ...properties });
    },
    [getOutcomeProperties],
  );

  const trackPage = useCallback(
    (event: OsUpdatePageEvent) => {
      if (isSamePageEvent(currentPageRef.current, event)) return;
      currentPageRef.current = event;

      if (event.page === OsUpdatePage.INSTALLING) {
        learntUpdateCountRef.current = event.updateCount;
        lastUpdateIndexRef.current = event.updateIndex;
        if (event.osVersionTo) lastOsVersionToRef.current = event.osVersionTo;
      }

      const screenKey = getScreenKey(event);
      if (screenKey === undefined || !sentScreensRef.current.has(screenKey)) {
        if (screenKey !== undefined) sentScreensRef.current.add(screenKey);
        trackPageEvent({
          category: event.page,
          props: { ...getPageProperties(event), ...getSharedProperties() },
        });
      }

      if (event.page === OsUpdatePage.SUCCESS) {
        trackOutcome(OsUpdateEvent.COMPLETED, {
          osVersionTo: lastOsVersionToRef.current ?? inputRef.current.osVersionTo,
        });
      }
    },
    [getSharedProperties, trackOutcome],
  );

  const trackClick = useCallback(
    (button: OsUpdateButton) => {
      const currentPage = currentPageRef.current;
      track("button_clicked", {
        button,
        page: currentPage?.page,
        ...(currentPage?.page === OsUpdatePage.ERROR && button === OsUpdateButton.CANCEL
          ? {
              step: currentPage.step,
              failureType: currentPage.failureType,
              subError: currentPage.subError,
            }
          : {}),
        ...(currentPage?.page === OsUpdatePage.SECURE_CONNECTION_REFUSED ||
        currentPage?.page === OsUpdatePage.CLOSE_CONFIRMATION ||
        (button === OsUpdateButton.CLOSE && currentPage && "step" in currentPage)
          ? { step: currentPage.step }
          : {}),
        ...getSharedProperties(),
      });
    },
    [getSharedProperties],
  );

  // A layout effect, so that the start is sent before the first page of the orchestrator.
  useLayoutEffect(() => {
    if (!isStarted || isStartedRef.current) return;
    isStartedRef.current = true;
    const { mode, osVersionFrom, osVersionTo } = inputRef.current;
    track(OsUpdateEvent.STARTED, {
      page: getStartPage(mode, currentPageRef.current?.page),
      osVersionFrom,
      osVersionTo,
      ...getSharedProperties(),
    });
  }, [isStarted, getSharedProperties]);

  useEffect(
    () => () => {
      trackOutcome(
        currentPageRef.current?.page === OsUpdatePage.ERROR
          ? OsUpdateEvent.FAILED
          : OsUpdateEvent.ABORTED,
      );
    },
    [trackOutcome],
  );

  const value = useMemo(() => ({ trackPage, trackClick }), [trackPage, trackClick]);

  return (
    <OsUpdateTrackingContext.Provider value={value}>{children}</OsUpdateTrackingContext.Provider>
  );
}
