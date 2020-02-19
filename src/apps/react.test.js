// @flow
import { renderHook } from "@testing-library/react-hooks";
import { initState } from "../../lib/apps";
import { deviceInfo155, mockListAppsResult } from "../../lib/apps/mock";
import {
  useAppInstallNeedsDeps,
  useAppInstallProgress,
  useAppsSections,
  useAppUninstallNeedsDeps
} from "./react";
import { useNotEnoughMemoryToInstall } from "../../lib/apps/react";

const mockedState = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash",
    "Litecoin (outdated), Ethereum, Ethereum Classic",
    deviceInfo155
  )
);

test("Apps hooks - useAppInstallNeedsDeps - Expect dep apps", () => {
  const { result } = renderHook(() =>
    useAppInstallNeedsDeps(mockedState, mockedState.appByName["Bitcoin Cash"])
  );

  expect(result.current.dependencies.length).toBe(1);
  expect(result.current.dependencies[0].name).toBe("Bitcoin");
});

test("Apps hooks - useAppInstallNeedsDeps - Expect no dep apps", () => {
  const { result } = renderHook(() =>
    useAppInstallNeedsDeps(mockedState, mockedState.appByName["Bitcoin"])
  );
  expect(result.current).toBe(null);
});

test("Apps hooks - useAppUninstallNeedsDeps - Expect dep apps", () => {
  const { result } = renderHook(() =>
    useAppUninstallNeedsDeps(mockedState, mockedState.appByName["Ethereum"])
  );
  expect(result.current.dependents.length).toBe(1);
  expect(result.current.dependents[0].name).toBe("Ethereum Classic");
});

test("Apps hooks - useAppUninstallNeedsDeps - Expect no dep apps", () => {
  const { result } = renderHook(() =>
    useAppUninstallNeedsDeps(
      mockedState,
      mockedState.appByName["Ethereum Classic"]
    )
  );
  expect(result.current).toBe(null);
});

test("Apps hooks - useAppInstallProgress - Queued or unknown app", () => {
  const { result } = renderHook(() =>
    useAppInstallProgress(mockedState, "not_in_queue")
  );
  expect(result.current).toBe(1);
});

test("Apps hooks - useAppInstallProgress - Current app", () => {
  const { result } = renderHook(() =>
    useAppInstallProgress(
      {
        ...mockedState,
        currentProgress: {
          appOp: { type: "install", name: "XRP" },
          progress: 0.71
        }
      },
      "XRP"
    )
  );
  expect(result.current).toBe(0.71);
});

const mockedWithFreeBlocksStateNanoS = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Stellar, Monero, Tezos",
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash",
    deviceInfo155 // NB 4096 blocks
  )
);

const mockedNoFreeBlocksStateNanoS = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Stellar, Monero, Tezos",
    "Bitcoin_4090blocks, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash",
    deviceInfo155 // NB 4096 blocks
  )
);

test("Apps hooks - useNotEnoughMemoryToInstall - Will fit new install", () => {
  const { result } = renderHook(() =>
    useNotEnoughMemoryToInstall(mockedWithFreeBlocksStateNanoS, "Tezos")
  );
  expect(result.current).toBe(false);
});

test("Apps hooks - useNotEnoughMemoryToInstall - Will not fit install", () => {
  const { result } = renderHook(() =>
    useNotEnoughMemoryToInstall(mockedNoFreeBlocksStateNanoS, "Tezos")
  );
  expect(result.current).toBe(true);
});

test("Apps hooks - useAppsSections - Correct number of updatable apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: { type: "name", order: "desc" }
    })
  );
  expect(result.current.update.length).toBe(1);
});

test("Apps hooks - useAppsSections - Correct number of installed apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: { type: "name", order: "desc" }
    })
  );
  expect(result.current.device.length).toBe(3);
});

test("Apps hooks - useAppsSections - Correct number of catalog apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: { type: "name", order: "desc" }
    })
  );
  expect(result.current.catalog.length).toBe(7);
});

test("Apps hooks - useAppsSections - Correct number of catalog apps with query", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "coin",
      appFilter: "all",
      sort: { type: "name", order: "desc" }
    })
  );
  expect(result.current.catalog.length).toBe(4);
});

test("Apps hooks - useAppsSections - Correct number of installed apps with query", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "coin",
      appFilter: "all",
      sort: { type: "name", order: "desc" }
    })
  );
  expect(result.current.device.length).toBe(1);
});
