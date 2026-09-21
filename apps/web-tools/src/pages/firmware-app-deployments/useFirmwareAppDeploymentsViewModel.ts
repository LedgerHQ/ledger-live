import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { readCache, writeCache } from "./cache";
import { collectMatrix } from "./collect";
import { DEVICES } from "./constants";
import {
  DEVICES_PARAM,
  devicesInMatrix,
  errorMessage,
  incompleteCollectionNotice,
  matchesFilter,
  parseDeviceSelection,
  serialiseDeviceSelection,
} from "./logic";
import type { Matrix, MatrixApp, MatrixColumn, Notice, ShownDevice } from "./types";

/** A column plus whether it opens a new device group, so rows need no per-row grouping. */
export type VisibleColumn = { column: MatrixColumn; startsGroup: boolean };

export type FirmwareAppDeploymentsViewModel = {
  matrix: Matrix | null;
  /** Devices in configured order, with the ones the current matrix cannot show disabled. */
  deviceOptions: { key: string; label: string; selected: boolean; disabled: boolean }[];
  devices: ShownDevice[];
  shownDevices: ShownDevice[];
  /** Every shown device's columns, flattened once so each row can map straight over it. */
  visibleColumns: VisibleColumn[];
  selectedKeys: Set<string>;
  /** Rows matching the text filter, and the whole catalogue it is matched against. */
  visibleApps: MatrixApp[];
  visibleCount: number;
  totalCount: number;
  filter: string;
  status: string | null;
  notice: Notice | null;
  refreshing: boolean;
  onFilterChange: (value: string) => void;
  onToggleDevice: (key: string) => void;
  onRefresh: () => void;
};

export const useFirmwareAppDeploymentsViewModel = (): FirmwareAppDeploymentsViewModel => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("search") ?? "";

  const [matrix, setMatrix] = useState<Matrix | null>(() => readCache());

  const selectedDevices = useMemo(
    () => parseDeviceSelection(searchParams.get(DEVICES_PARAM)),
    [searchParams],
  );

  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  // Only failures live in state; the incomplete-collection notice is derived from the matrix.
  const [failure, setFailure] = useState<Notice | null>(null);

  // Read inside refresh() without making the callback depend on the matrix, so a
  // refresh in flight is never restarted by the state it is about to replace.
  const matrixRef = useRef(matrix);
  matrixRef.current = matrix;

  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    setFailure(null);

    const hadData = matrixRef.current !== null;

    try {
      const collected = await collectMatrix(setStatus);
      const cacheError = writeCache(collected);

      setMatrix(collected);
      setFailure(cacheError ? { appearance: "warning", title: cacheError } : null);
    } catch (error) {
      const message = errorMessage(error);
      setFailure(
        hadData
          ? {
              appearance: "warning",
              title: "Refresh failed — showing the cached copy.",
              details: [message],
            }
          : {
              appearance: "error",
              title: "Could not load the catalog.",
              details: [
                message,
                "The API is read directly from your browser, so an offline machine or a " +
                  "blocked network will do this. Press Refresh to try again.",
              ],
            },
      );
    } finally {
      setStatus(null);
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  // A usable cache renders immediately and is refreshed by hand; only a cold start fetches.
  useEffect(() => {
    if (matrixRef.current === null) void refresh();
  }, [refresh]);

  const onToggleDevice = useCallback(
    (key: string) => {
      setSearchParams(
        previous => {
          const selected = parseDeviceSelection(previous.get(DEVICES_PARAM));
          if (!selected.delete(key)) selected.add(key);

          const next = new URLSearchParams(previous);
          const value = serialiseDeviceSelection(selected);
          if (value === null) next.delete(DEVICES_PARAM);
          else next.set(DEVICES_PARAM, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const onFilterChange = useCallback(
    (value: string) => {
      // `replace`, not push: typing must not fill the back button.
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          if (value.trim()) next.set("search", value);
          else next.delete("search");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const deviceOptions = useMemo(
    () =>
      DEVICES.map(({ key, label }) => ({
        key,
        label,
        selected: selectedDevices.has(key),
        disabled: !matrix?.columns[key],
      })),
    [matrix, selectedDevices],
  );

  /** Every device the matrix holds, in DEVICES order — the config, not the cached data. */
  const devices = useMemo(() => devicesInMatrix(matrix?.columns), [matrix]);

  const shownDevices = useMemo(
    () => devices.filter(device => selectedDevices.has(device.key)),
    [devices, selectedDevices],
  );

  const visibleColumns = useMemo(
    () =>
      shownDevices.flatMap((device, deviceIndex) =>
        (matrix?.columns[device.key] ?? []).map((column, columnIndex) => ({
          column,
          startsGroup: deviceIndex > 0 && columnIndex === 0,
        })),
      ),
    [matrix, shownDevices],
  );

  const selectedKeys = useMemo(
    () => new Set(shownDevices.map(device => device.key)),
    [shownDevices],
  );

  /*
   * Only the text filter decides which rows exist. Hiding a device must not remove apps:
   * an app missing from a shown device is the gap the table exists to report.
   */
  const visibleApps = useMemo(() => {
    if (!matrix) return [];

    const needle = filter.trim().toLowerCase();
    return needle ? matrix.apps.filter(app => matchesFilter(app, needle)) : matrix.apps;
  }, [matrix, filter]);

  // A failure is about this moment and outranks the standing warning about the matrix on
  // screen. One banner is rendered, so the order matters.
  const notice = failure ?? incompleteCollectionNotice(matrix);

  return {
    matrix,
    deviceOptions,
    devices,
    shownDevices,
    visibleColumns,
    selectedKeys,
    visibleApps,
    visibleCount: visibleApps.length,
    totalCount: matrix?.apps.length ?? 0,
    filter,
    status,
    notice,
    refreshing,
    onFilterChange,
    onToggleDevice,
    onRefresh: refresh,
  };
};
