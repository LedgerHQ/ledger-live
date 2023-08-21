import { Subject } from "rxjs";
import { renderHook, act } from "@testing-library/react-hooks";
import { initState } from ".";
import { deviceInfo155, mockListAppsResult } from "./mock";
import {
  useAppInstallNeedsDeps,
  useAppInstallProgress,
  useAppsSections,
  useAppUninstallNeedsDeps,
} from "./react";
import { useNotEnoughMemoryToInstall } from "./react";
import { AppType, SortOptions } from "./filtering";
import { calculateDependencies } from "./polyfill";

calculateDependencies();
const mockedState = initState(
  mockListAppsResult(
    "Bitcoin, Bitcoin Legacy, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Decred",
    "Litecoin (outdated), Ethereum, Ethereum Classic",
    deviceInfo155,
  ),
);
test("Apps hooks - useAppInstallNeedsDeps - Expect Bitcoin cash to depend on bitcoin legacy", () => {
  const { result = <any>{} } = renderHook(() =>
    useAppInstallNeedsDeps(mockedState, mockedState.appByName["Bitcoin Cash"]),
  );
  expect(result?.current.dependencies.length).toBe(1);
  expect(result?.current.dependencies[0].name).toBe("Bitcoin");
  //TODO: Reactivate the following code after new bitcoin nano app 2.1.0
  /*
  expect(result?.current.dependencies.length).toBe(1);
  expect(result?.current.dependencies[0].name).toBe("Bitcoin Legacy");
  */
});
test("Apps hooks - useAppInstallNeedsDeps - Expect Decred to not depend on bitcoin", () => {
  const { result = <any>{} } = renderHook(() =>
    useAppInstallNeedsDeps(mockedState, mockedState.appByName["Decred"]),
  );
  expect(result.current).toBe(null);
});
test("Apps hooks - useAppInstallNeedsDeps - Expect no dep apps", () => {
  const { result } = renderHook(() =>
    useAppInstallNeedsDeps(mockedState, mockedState.appByName["Bitcoin"]),
  );
  expect(result.current).toBe(null);
});
test("Apps hooks - useAppUninstallNeedsDeps - Expect dep apps", () => {
  const { result = <any>{} } = renderHook(() =>
    useAppUninstallNeedsDeps(mockedState, mockedState.appByName["Ethereum"]),
  );
  expect(result.current.dependents.length).toBe(1);
  expect(result.current.dependents[0].name).toBe("Ethereum Classic");
});
test("Apps hooks - useAppUninstallNeedsDeps - Expect no dep apps", () => {
  const { result } = renderHook(() =>
    useAppUninstallNeedsDeps(mockedState, mockedState.appByName["Ethereum Classic"]),
  );
  expect(result.current).toBe(null);
});
test("Apps hooks - useAppInstallProgress - Queued or unknown app", () => {
  const { result } = renderHook(() => useAppInstallProgress(mockedState, "not_in_queue"));
  expect(result.current).toBe(0);
});
test("Apps hooks - useAppInstallProgress - Current app", () => {
  const currentProgressSubject: Subject<number> = new Subject();
  const { result = <any>{} } = renderHook(() =>
    useAppInstallProgress(
      {
        ...mockedState,
        currentProgressSubject,
        currentAppOp: {
          type: "install",
          name: "XRP",
        },
      },
      "XRP",
    ),
  );
  act(() => {
    currentProgressSubject.next(0.71);
  });
  expect(result.current).toBe(0.71);
});
const mockedWithFreeBlocksStateNanoS = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Stellar, Monero, Tezos",
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash",
    deviceInfo155, // NB 4096 blocks
  ),
);
const mockedNoFreeBlocksStateNanoS = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Stellar, Monero, Tezos",
    "Bitcoin_4090blocks, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash",
    deviceInfo155, // NB 4096 blocks
  ),
);
test("Apps hooks - useNotEnoughMemoryToInstall - Will fit new install", () => {
  const { result } = renderHook(() =>
    useNotEnoughMemoryToInstall(mockedWithFreeBlocksStateNanoS, "Tezos"),
  );
  expect(result.current).toBe(false);
});
test("Apps hooks - useNotEnoughMemoryToInstall - Will not fit install", () => {
  const { result } = renderHook(() =>
    useNotEnoughMemoryToInstall(mockedNoFreeBlocksStateNanoS, "Tezos"),
  );
  expect(result.current).toBe(true);
});
test("Apps hooks - useAppsSections - Correct number of updatable apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: {
        type: "name",
        order: "desc",
      },
    }),
  );
  expect(result.current.update.length).toBe(1);
});
test("Apps hooks - useAppsSections - Correct number of installed apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: {
        type: "name",
        order: "desc",
      },
    }),
  );
  expect(result.current.device.length).toBe(3);
});
test("Apps hooks - useAppsSections - Correct number of catalog apps", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "",
      appFilter: "all",
      sort: {
        type: "name",
        order: "desc",
      },
    }),
  );
  expect(result.current.catalog.length).toBe(9);
});
test("Apps hooks - useAppsSections - Correct number of catalog apps with query", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "coin",
      appFilter: "all",
      sort: {
        type: "name",
        order: "desc",
      },
    }),
  );
  expect(result.current.catalog.length).toBe(5);
});
test("Apps hooks - useAppsSections - Correct number of installed apps with query", () => {
  const { result } = renderHook(() =>
    useAppsSections(mockedState, {
      query: "coin",
      appFilter: "all",
      sort: {
        type: "name",
        order: "desc",
      },
    }),
  );
  expect(result.current.device.length).toBe(1);
});

const mockedStateWithInstallQueue = {
  ...initState(
    mockListAppsResult(
      "Bitcoin, Bitcoin Legacy, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Decred",
      "Litecoin (outdated), Ethereum, Ethereum Classic",
      deviceInfo155,
    ),
  ),
  installQueue: ["Bitcoin", "Dogecoin"],
};

test('Apps hooks - useAppsSections - Sort "device" category apps with installing apps first', () => {
  const options = {
    query: "",
    appFilter: "all" as AppType,
    sort: { type: "name", order: "desc" } as SortOptions,
  };
  const { result: vanillaResult } = renderHook(() => useAppsSections(mockedState, options));
  const { result: installQueueResult } = renderHook(() =>
    useAppsSections(mockedStateWithInstallQueue, options),
  );
  // "catalog" and "update" categories should be similar with/without install queue
  expect(vanillaResult.current.catalog).toMatchObject(installQueueResult.current.catalog);
  expect(vanillaResult.current.update).toMatchObject(installQueueResult.current.update);
  // "device" category should be sorted differently
  expect(vanillaResult.current.device.map(elt => elt.name)).toMatchObject([
    // Installed apps
    "Ethereum",
    "Litecoin",
    "Ethereum Classic",
  ]);
  expect(installQueueResult.current.device.map(elt => elt.name)).toMatchObject([
    // Apps being installed
    "Bitcoin",
    "Dogecoin",
    // Installed apps
    "Ethereum",
    "Litecoin",
    "Ethereum Classic",
  ]);
});
