import { of, throwError } from "rxjs";
import { retryOnErrorsCommandWrapper, sharedLogicTaskWrapper } from "./core";
import { DisconnectedDevice, LockedDeviceError } from "@ledgerhq/errors";
import { concatMap } from "rxjs/operators";
import { TransportRef } from "../transports/core";
import { aTransportRefBuilder } from "../mocks/aTransportRef";

// Fakes the timer to accelerate the test
// For this tests suite, easier than jest.useFakeTimers() + jest.advanceTimersByTime() etc.
jest.mock("rxjs", () => {
  const lib = jest.requireActual("rxjs");
  lib.timer = jest.fn(() => of(1));
  return lib;
});

describe("sharedLogicTaskWrapper", () => {
  const task = jest.fn();
  const wrappedTask = sharedLogicTaskWrapper<void, { type: "data" }>(task);

  afterAll(() => {
    task.mockClear();
  });

  describe("When the task emits an non-error event", () => {
    it("should pass the event through", (done) => {
      task.mockReturnValue(of({ type: "data" }));

      wrappedTask().subscribe({
        next: (event) => {
          try {
            expect(event).toEqual({ type: "data" });
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the task emits an error that is not handled by the shared logic", () => {
    it("should not retry the task and emits the error", (done) => {
      task.mockReturnValue(throwError(new Error("Unhandled error")));

      wrappedTask().subscribe({
        next: (event) => {
          try {
            expect(event).toEqual({
              type: "error",
              error: new Error("Unhandled error"),
            });
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the task emits an error that is handled by the shared logic", () => {
    it("should retry infinitely and emits an error event until a correct event is emitted", (done) => {
      let counter = 0;

      task.mockReturnValue(
        of({ type: "data" }).pipe(
          concatMap((event) => {
            if (counter < 3) {
              return throwError(new LockedDeviceError("Handled error"));
            }

            return of(event);
          })
        )
      );

      wrappedTask().subscribe({
        next: (event) => {
          try {
            if (counter < 3) {
              expect(event).toEqual({
                type: "error",
                error: new LockedDeviceError("Handled error"),
              });
            } else {
              expect(event).toEqual({ type: "data" });
              done();
            }

            counter++;
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });
});

describe("retryOnErrorsCommandWrapper", () => {
  const command = jest.fn();
  const disconnectedDeviceMaxRetries = 3;
  let transportRef: TransportRef;
  let wrappedCommand;

  beforeEach(async () => {
    transportRef = await aTransportRefBuilder();

    wrappedCommand = retryOnErrorsCommandWrapper<void, { type: "data" }>({
      command,
      allowedErrors: [
        {
          maxRetries: disconnectedDeviceMaxRetries,
          errorClass: DisconnectedDevice,
        },
        {
          maxRetries: "infinite",
          errorClass: LockedDeviceError,
        },
      ],
    });
  });

  afterAll(() => {
    command.mockClear();
  });

  describe("When the command emits an non-error event", () => {
    it("should pass the event through", (done) => {
      command.mockReturnValue(of({ type: "data" }));

      wrappedCommand(transportRef).subscribe({
        next: (event) => {
          try {
            expect(event).toEqual({ type: "data" });
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the command emits an error that is not set to be handled by the wrapper", () => {
    it("should not retry the command and throw the error", (done) => {
      command.mockReturnValue(throwError(new Error("Unhandled error")));

      wrappedCommand(transportRef).subscribe({
        error: (error) => {
          try {
            expect(error).toEqual(new Error("Unhandled error"));
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });
  });

  describe("When the command throws an error that is set to be handled by the wrapper, and this error can be retried a limited number of times", () => {
    it("should retry the defined limited number of time and not emit an error event until a correct event is emitted", (done) => {
      let counter = 0;

      command.mockReturnValue(
        of({ type: "data" }).pipe(
          concatMap((event) => {
            // Increments before the condition check below so it could keep incrementing after reaching disconnectedDeviceMaxRetries
            // to make sure the event is received the first time it is emitted and no other retry occurred after
            counter++;

            // Throws an error until before the limit is reached
            if (counter < disconnectedDeviceMaxRetries) {
              return throwError(
                new DisconnectedDevice(
                  `Handled error max ${disconnectedDeviceMaxRetries}`
                )
              );
            }

            return of(event);
          })
        )
      );

      wrappedCommand(transportRef).subscribe({
        next: (event) => {
          try {
            // It reaches disconnectedDeviceMaxRetries because of our condition inside the mocked task
            // but it could be anything <= disconnectedDeviceMaxRetries.
            expect(counter).toBe(disconnectedDeviceMaxRetries);
            // It should not receive error event, the retry is silent, and only the data event should be received
            expect(event).toEqual({ type: "data" });
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });

    it("should retry a limited number of time and throw the error if it is not resolved", (done) => {
      let counter = 0;

      command.mockReturnValue(
        of({ type: "data" }).pipe(
          concatMap((_event) => {
            counter++;

            // Throws an error even after the limit is reached
            return throwError(
              new DisconnectedDevice(
                `Handled error max ${disconnectedDeviceMaxRetries}`
              )
            );
          })
        )
      );

      wrappedCommand(transportRef).subscribe({
        error: (error) => {
          try {
            expect(counter).toBe(disconnectedDeviceMaxRetries + 1);

            expect(error).toEqual(
              new DisconnectedDevice(
                `Handled error max ${disconnectedDeviceMaxRetries}`
              )
            );
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
      });
    });

    describe("and several type of errors are thrown", () => {
      it("should retry until one type of error is retried the maximum number of time in a row", (done) => {
        let counter = 0;

        command.mockReturnValue(
          of({ type: "data" }).pipe(
            concatMap((_event) => {
              counter++;

              // Throws an error until just before the limit is reached
              if (counter < disconnectedDeviceMaxRetries) {
                return throwError(
                  new DisconnectedDevice(
                    `Handled error max ${disconnectedDeviceMaxRetries}`
                  )
                );
              }
              // Then throws a different handled error
              else if (counter < disconnectedDeviceMaxRetries + 1) {
                return throwError(new LockedDeviceError("Handled error"));
              }
              // Finally throws again the first limited handled error
              // It should retry again until disconnctedDeviceMaxRetries is again reached
              // Which is counter == disconnectedDeviceMaxRetries * 2 + 1
              else {
                return throwError(
                  new DisconnectedDevice(
                    `Handled error max ${disconnectedDeviceMaxRetries}`
                  )
                );
              }
            })
          )
        );

        const expectedCounterAtDisconnectedDeviceError =
          disconnectedDeviceMaxRetries * 2 + 1;

        wrappedCommand(transportRef).subscribe({
          error: (error) => {
            try {
              expect(counter).toBe(expectedCounterAtDisconnectedDeviceError);

              expect(error).toEqual(
                new DisconnectedDevice(
                  `Handled error max ${disconnectedDeviceMaxRetries}`
                )
              );
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
        });
      });
    });
  });

  describe("When the command throws an error that is set to be handled by the wrapper, and this error can be retried an infinite number of times", () => {
    it("should retry infinitely, without throwing an error, until a correct event is emitted", (done) => {
      let counter = 0;
      const randomNumberOfRetries = Math.floor(Math.random() * 10 + 5);

      command.mockReturnValue(
        of({ type: "data" }).pipe(
          concatMap((event) => {
            counter++;

            // Throws an error until a random number of times
            if (counter < randomNumberOfRetries) {
              return throwError(
                new LockedDeviceError(
                  `Handled infinite retries error that should be thrown ${randomNumberOfRetries} times`
                )
              );
            }

            return of(event);
          })
        )
      );

      wrappedCommand(transportRef).subscribe({
        next: (event) => {
          try {
            // No error or event should have been emitted before the correct event
            expect(counter).toBe(randomNumberOfRetries);
            expect(event).toEqual({ type: "data" });
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: (error) => done(error),
      });
    });
  });
});
