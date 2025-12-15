import { TestScheduler } from "rxjs/testing";
import installApp from "./installApp";
import ManagerAPI from "../manager/api";
import { defer, of, throwError } from "rxjs";
import { anAppBuilder } from "../mock/fixtures/anApp";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import {
  LockedDeviceError,
  ManagerDeviceLockedError,
  UnresponsiveDeviceError,
} from "@ledgerhq/errors";
import { quitApp } from "../deviceSDK/commands/quitApp";

// Mocking ManagerAPI
jest.mock("../manager/api", () => {
  const originalModule = jest.requireActual("../manager/api");

  return {
    ...originalModule,
    install: jest.fn(),
  };
});

jest.mock("../deviceSDK/commands/quitApp", () => ({
  quitApp: jest.fn(),
}));

const mockManagerApiInstall = jest.mocked(ManagerAPI.install);
const mockQuitApp = jest.mocked(quitApp);

describe("installApp", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      // Makes TestScheduler assertions works with our test framework Jest
      expect(actual).toEqual(expected);
    });

    mockManagerApiInstall.mockReset();
    mockQuitApp.mockReset();

    mockQuitApp.mockReturnValue(of<void>(undefined));
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

  test("it should run quit app at the beginning then keep going with manager", () => {
    const transport = aTransportBuilder();
    const app = anAppBuilder();

    const fakeEvent = {
      type: "bulk-progress",
      progress: 0.5,
    };

    mockManagerApiInstall.mockReturnValue(of(fakeEvent));

    const results: Array<{ progress: number }> = [];

    installApp(transport, "target-test", app).subscribe({
      next: v => results.push(v),
      error: e => {
        throw e;
      },
    });

    // quitApp called once, with the same transport
    expect(mockQuitApp).toHaveBeenCalledTimes(1);
    expect(mockQuitApp).toHaveBeenCalledWith(transport);

    // ManagerAPI.install called once, with correct params
    expect(mockManagerApiInstall).toHaveBeenCalledTimes(1);
    expect(mockManagerApiInstall).toHaveBeenCalledWith(
      transport,
      "install-app",
      expect.objectContaining({
        targetId: "target-test",
        perso: app.perso,
        deleteKey: app.delete_key,
        firmware: app.firmware,
        firmwareKey: app.firmware_key,
        hash: app.hash,
      }),
    );

    // quitApp must be invoked before ManagerAPI.install
    expect(mockQuitApp.mock.invocationCallOrder[0]).toBeLessThan(
      mockManagerApiInstall.mock.invocationCallOrder[0],
    );

    expect(results).toEqual([{ progress: 0.5 }]);
  });

  test("it should return error if quit app fail", done => {
    const transport = aTransportBuilder();
    const app = anAppBuilder();
    const error = new Error("quit failed");

    mockQuitApp.mockReturnValueOnce(throwError(() => error));

    const observable = installApp(transport, "target-test", app);

    observable.subscribe({
      next: () => {
        done(new Error("Expected an error, but got a next notification"));
      },
      error: err => {
        expect(err).toBe(error);
        // ManagerAPI.install should never be called if quitApp fails
        expect(mockManagerApiInstall).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
