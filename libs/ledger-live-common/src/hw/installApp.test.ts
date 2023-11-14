import { TestScheduler } from "rxjs/testing";
import installApp from "./installApp";
import ManagerAPI from "../manager/api";
import { defer } from "rxjs";
import { anAppBuilder } from "../mock/fixtures/anApp";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import {
  LockedDeviceError,
  ManagerDeviceLockedError,
  UnresponsiveDeviceError,
} from "@ledgerhq/errors";

// Mocking ManagerAPI
jest.mock("../manager/api", () => {
  const originalModule = jest.requireActual("../manager/api");

  return {
    ...originalModule,
    install: jest.fn(),
  };
});
const mockManagerApiInstall = jest.mocked(ManagerAPI.install);

describe("installApp", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      // Makes TestScheduler assertions works with our test framework Jest
      expect(actual).toEqual(expected);
    });
  });

  test("On one error followed by a successfully emitted event, it should retry after the given delay", () => {
    testScheduler.run(({ cold, expectObservable }) => {
      let count = 0;
      const fakeEvent = {
        type: "bulk-progress",
        progress: 0.8,
      };

      // The first time an error is thrown. The 2nd time a correct event is emitted.
      mockManagerApiInstall.mockReturnValueOnce(
        defer(() => {
          if (count > 0) {
            return cold("a", {
              a: fakeEvent,
            });
          }

          count += 1;
          // Throws an error
          return cold("#");
        }),
      );

      // The `transport` and `app` can be fake as the ManagerAPI.install is mocked
      const installObservable = installApp(aTransportBuilder(), "target-test", anAppBuilder(), {
        retryDelayMs: 500,
        retryLimit: 1,
      });

      const expectedResult = "- 499ms a";
      expectObservable(installObservable).toBe(expectedResult, {
        a: {
          progress: 0.8,
        },
      });
    });
  });

  test("On too many errors, it should retry with a delay but finally throw the error", () => {
    const retryLimit = 3;

    testScheduler.run(({ cold, expectObservable }) => {
      let count = 0;
      const fakeEvent = {
        type: "bulk-progress",
        progress: 0.8,
      };

      // The first time an error is thrown. The 2nd time a correct event is emitted.
      mockManagerApiInstall.mockReturnValueOnce(
        defer(() => {
          // A correct event is emitted only after the max number of retry attempts
          // which will be too late.
          if (count > retryLimit) {
            return cold("a", {
              a: fakeEvent,
            });
          }

          count += 1;
          // Throws an error
          return cold("#");
        }),
      );

      // The `transport` and `app` can be fake as the ManagerAPI.install is mocked
      const installObservable = installApp(aTransportBuilder(), "target-test", anAppBuilder(), {
        retryDelayMs: 500,
        retryLimit,
      });

      const expectedResult = "- 499ms - 499ms - 499ms #";
      expectObservable(installObservable).toBe(expectedResult);
    });
  });

  test("On a locked device error, it should not retry and throw directly the error", () => {
    const lockedDeviceErrors = [
      new LockedDeviceError(),
      new ManagerDeviceLockedError(),
      new UnresponsiveDeviceError(),
    ];

    for (const error of lockedDeviceErrors) {
      testScheduler.run(({ cold, expectObservable }) => {
        let count = 0;
        const fakeEvent = {
          type: "bulk-progress",
          progress: 0.8,
        };

        // The first time an error is thrown. The 2nd time a correct event is emitted.
        mockManagerApiInstall.mockReturnValueOnce(
          defer(() => {
            if (count > 0) {
              return cold("a", {
                a: fakeEvent,
              });
            }

            count += 1;
            // Throws an error
            return cold("#", undefined, error);
          }),
        );

        // The `transport` and `app` can be fake as the ManagerAPI.install is mocked
        const installObservable = installApp(aTransportBuilder(), "target-test", anAppBuilder(), {
          retryDelayMs: 500,
          retryLimit: 1,
        });

        // It emits the error without any retry
        const expectedResult = "#";
        expectObservable(installObservable).toBe(expectedResult, undefined, error);
      });
    }
  });
});
