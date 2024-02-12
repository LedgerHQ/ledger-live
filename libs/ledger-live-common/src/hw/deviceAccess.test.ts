import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "./deviceAccess";
import { from, of } from "rxjs";

jest.useFakeTimers();

// Only mocks `open`
jest.mock(".", () => {
  // Imports and retains the original functionalities
  const originalModule = jest.requireActual(".");

  return {
    ...originalModule,
    open: jest.fn().mockReturnValue(Promise.resolve(new Transport())),
  };
});

const deviceId = "test_device";

describe("withDevice", () => {
  describe("When there is only 1 job", () => {
    it("should provide a transport and run the given job", done => {
      const job = jest.fn().mockReturnValue(of("job test result"));

      withDevice(deviceId)(job).subscribe({
        next: () => {
          try {
            expect(job).toHaveBeenCalledWith(expect.any(Transport));
            done();
          } catch (expectError) {
            done(expectError);
          }
        },
        error: e => done(`It should not have failed: ${JSON.stringify(e)}`),
      });
    });
  });

  describe("When a 2nd job is trying to run while another job is ongoing", () => {
    describe("And the 1st job is successful", () => {
      it("should run the 2 jobs sequentially", done => {
        const job1Duration = 1000;
        // Mocking rxjs timer is difficult -> using `setTimeout` instead of a rxjs `delay`
        const job1 = jest.fn().mockReturnValue(
          from(
            new Promise(resolve => {
              setTimeout(() => resolve("job 1 test result"), job1Duration);
            }),
          ),
        );
        const job2 = jest.fn().mockReturnValue(of("job 2 test result"));

        let job1_ended = false;
        // Registers first the job1
        withDevice(deviceId)(job1).subscribe({
          next: () => {
            job1_ended = true;
          },
          error: e => done(`It should not have failed: ${JSON.stringify(e)}`),
        });

        // And then job2, that should wait that job1 is finished
        withDevice(deviceId)(job2).subscribe({
          next: () => {
            try {
              // job1 should have been called before
              expect(job1).toHaveBeenCalledWith(expect.any(Transport));
              expect(job2).toHaveBeenCalledWith(expect.any(Transport));
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: e => done(`It should not have failed: ${JSON.stringify(e)}`),
        });

        // job 1 should not have started yet
        expect(job1_ended).toBe(false);
        // Advances job 1
        jest.advanceTimersByTime(job1Duration);
      });
    });

    describe("And the 1st job failed", () => {
      it("should still run the 2 jobs sequentially", done => {
        const job1Duration = 1000;
        // Mocking rxjs timer is difficult -> using `setTimeout` instead of a rxjs `delay`
        const job1 = jest.fn().mockReturnValue(
          from(
            // This time, job 1 failed
            new Promise((_resolve, reject) => {
              setTimeout(() => reject("job 1 failed"), job1Duration);
            }),
          ),
        );
        const job2 = jest.fn().mockReturnValue(of("job 2 test result"));

        let job1_ended = false;
        // Registers first the job1
        withDevice(deviceId)(job1).subscribe({
          next: () => {
            done(`Job 1 should not have succeeded`);
          },
          error: _e => {
            job1_ended = true;
          },
        });

        // And then job2, that should wait that job1 is finished
        withDevice(deviceId)(job2).subscribe({
          next: () => {
            try {
              // job1 should have been called before
              expect(job1).toHaveBeenCalledWith(expect.any(Transport));
              expect(job2).toHaveBeenCalledWith(expect.any(Transport));
              done();
            } catch (expectError) {
              done(expectError);
            }
          },
          error: e => done(`It should not have failed: ${JSON.stringify(e)}`),
        });

        // job 1 should not have started yet
        expect(job1_ended).toBe(false);
        // Advances job 1
        jest.advanceTimersByTime(job1Duration);
      });
    });
  });
});
