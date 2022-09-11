// @ts-nocheck
import { renderHook } from "@testing-library/react-hooks";
import useBIM from "./reactBIM";
import { useFeature } from "../featureFlags";
import { withDevice } from "../hw/deviceAccess";
import { resolveTransportModuleForDeviceId } from "../hw";
import { deviceInfo155, mockListAppsResult } from "./mock";
import { initState } from ".";

jest.mock("../featureFlags"); // Nb we can't rely on the real thing
jest.mock("../hw/deviceAccess"); // Nb we can't rely on the real thing
jest.mock("../hw"); // Nb the resolution is handled per platform on the live-common-setup file

const mockedUseFeature = jest.mocked(useFeature);
const mockedTransportResolver = jest.mocked(resolveTransportModuleForDeviceId);
const mockedWithDevice = jest.mocked(withDevice);

const mockedState = initState(
  mockListAppsResult(
    "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP, Bitcoin Cash, Decred",
    "Litecoin (outdated), Ethereum, Ethereum Classic",
    deviceInfo155
  )
);

/**
 * The tests below only cover the gatekeeping of the BIM feature meaning we only check whether
 * we access it or not depending on our setup. BIM will only be accessible initially to LLM users
 * on a specific transport we named "ble-bim". The feature is also behind a feature flag that allows
 * us to disable it, falling back to the implementation from react.ts in this same folder.
 *
 * There is no new logic introduced here in terms of state handling of the operations, we are just
 * running the communication part on the native side. There are separate implementations for iOS and
 * Android in their corresponding languages.
 */
const gateKeepingScenarios = [
  // The only case where we should be using this hook.
  {
    name: "Expect it to run if flag is ON & transport is correct.",
    flagEnabled: true,
    transportId: "ble-bim",
    expectedValue: true,
  },
  // Feature flag is on, but we may be using an older version of LLM, a wired transport,
  // be on the CLI, or LLD. This BIM feature is only available on LLM and over BLE.
  {
    name: "Expect it to not run if flag is OFF & transport is incorrect.",
    flagEnabled: true,
    transportId: "not-ble-bim",
    expectedValue: false,
  },
  // Of course, if the feature flag is OFF then we don't want to use BIM, even if the transport
  // is correct. This allows us to remotely disable it for all our users.
  {
    name: "Expect it to not run if flag is OFF & transport is correct.",
    flagEnabled: false,
    transportId: "ble-bim",
    expectedValue: false,
  },
  // Needless to say, if all is OFF, then we shouldn't be entering it either.
  {
    name: "Expect it to not run if flag is OFF & transport is incorrect.",
    flagEnabled: false,
    transportId: "not-ble-bim",
    expectedValue: false,
  },
];
describe("BIM feature", () => {
  describe("Gatekeeping", () => {
    gateKeepingScenarios.forEach((scenario) => {
      const { name, flagEnabled, transportId, expectedValue } = scenario;

      it(name, () => {
        // Mock the feature flag
        mockedUseFeature.mockReturnValue({ enabled: flagEnabled });

        // @ts-expect-error Mock the transport resolution, we only run on llm-ble
        mockedTransportResolver.mockReturnValue({ id: transportId });

        const { result } = renderHook(() => useBIM("", mockedState, () => {}));
        expect(result.current).toBe(expectedValue);
      });
    });
  });

  // Super finicky to test this, we can only rely on the state changes by mocking
  // the transport communication and whatnot. Maybe this is a futile endeavour.
  describe("Queues", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockedUseFeature.mockReturnValue({ enabled: true });
      mockedTransportResolver.mockReturnValue({ id: "ble-bim" });
    });

    test("Expect to trigger a Queue if state has install items", (done) => {
      const mockedBleTransport = {
        queue: (observer, rawQueue) => {
          expect(rawQueue.includes('"appName":"Bitcoin"')).toBe(true);
          expect(rawQueue.includes('"appName":"SomeOtherApp"')).toBe(false);
          done();
        },
      };
      mockedWithDevice.mockReturnValue((job) => job(mockedBleTransport));
      const state = { ...mockedState, installQueue: ["Bitcoin"] };
      renderHook(() => useBIM("12:34:56:78", state, (_) => {}));
    });

    test("Expect to trigger a Queue if state has uninstall items", (done) => {
      const mockedBleTransport = {
        queue: (observer, rawQueue) => {
          expect(rawQueue.includes('"appName":"Bitcoin"')).toBe(true);
          expect(rawQueue.includes('"appName":"SomeOtherApp"')).toBe(false);
          done();
        },
      };
      mockedWithDevice.mockReturnValue((job) => job(mockedBleTransport));
      const state = { ...mockedState, uninstallQueue: ["Bitcoin"] };
      renderHook(() => useBIM("12:34:56:78", state, (_) => {}));
    });

    test("Events triggered from the transport, reach the dispatcher", (done) => {
      const mockedBleTransport = {
        queue: (observer) => {
          observer.next({
            type: "runStart",
            appOp: {
              name: "Bitcoin",
              type: "install",
            },
          });
        },
      };
      mockedWithDevice.mockReturnValue((job) => job(mockedBleTransport));
      const state = { ...mockedState, installQueue: ["Bitcoin"] };
      renderHook(() =>
        useBIM("12:34:56:78", state, (_) => {
          done();
        })
      );
    });

    test("Completing the queue observer emits a cleanup event", (done) => {
      const mockedBleTransport = {
        queue: (observer, rawQueue) => {
          expect(rawQueue.includes('"appName":"Bitcoin"')).toBe(true);
          observer.complete();
        },
      };
      mockedWithDevice.mockReturnValue((job) => job(mockedBleTransport));
      const state = { ...mockedState, uninstallQueue: ["Bitcoin"] };
      renderHook(() =>
        useBIM("12:34:56:78", state, (e) => {
          expect(e).toEqual({ type: "wipe-queue" });
          done();
        })
      );
    });

    test("Failing the queue observer emits a cleanup event", (done) => {
      const mockedBleTransport = {
        queue: (observer, rawQueue) => {
          expect(rawQueue.includes('"appName":"Bitcoin"')).toBe(true);
          observer.error(new Error("something-bad-happened"));
        },
      };
      mockedWithDevice.mockReturnValue((job) => job(mockedBleTransport));
      const state = { ...mockedState, uninstallQueue: ["Bitcoin"] };
      renderHook(() =>
        useBIM("12:34:56:78", state, (e) => {
          expect(e.type).toEqual("runError");
          done();
        })
      );
    });
  });
});

/**
 * Nb Internally, the useBIM hook relies on token resolution but that's handled using
 * a backend service and doesn't make sense to cover it here.
 */
