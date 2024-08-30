import { concat, from, Observable, of, throwError } from "rxjs";
import { DeleteAppDataError, DeleteAppDataEvent, DeleteAppDataEventType } from "./types";
import { deleteAppDataUseCase } from "./deleteAppDataUseCase";

describe("deleteAppDataUseCase", () => {
  const deleteAppDataFn = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success cases", () => {
    it("should emit the correct events when the app data is deleted", done => {
      deleteAppDataFn.mockReturnValue(
        from([
          {
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          },
          {
            type: DeleteAppDataEventType.AppDataDeleted,
          },
        ]),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> =
        deleteAppDataUseCase(deleteAppDataFn);

      const events: DeleteAppDataEvent[] = [];

      deleteAppDataUseCaseObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          expect(events).toHaveLength(2);
          expect(events[0]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          });
          expect(events[1]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleted,
          });
          done();
        },
        error: (e: Error) => {
          done(e);
        },
      });
    });

    it("should emit the correct events when the app data is not found", done => {
      deleteAppDataFn.mockReturnValue(
        from([
          {
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          },
          {
            type: DeleteAppDataEventType.NoAppDataToDelete,
          },
        ]),
      );

      const events: DeleteAppDataEvent[] = [];

      deleteAppDataUseCase(deleteAppDataFn).subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          expect(events).toHaveLength(2);
          expect(events[0]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          });
          expect(events[1]).toEqual({
            type: DeleteAppDataEventType.NoAppDataToDelete,
          });
          done();
        },
        error: (e: Error) => {
          done(e);
        },
      });
    });
  });

  describe("error cases", () => {
    it("should emit the correct events when there is an error deleting the app data", done => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new DeleteAppDataError("Error deleting app data")),
        ),
      );

      const events: DeleteAppDataEvent[] = [];

      deleteAppDataUseCase(deleteAppDataFn).subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Should not complete"));
        },
        error: (e: Error) => {
          try {
            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({
              type: DeleteAppDataEventType.AppDataDeleteStarted,
            });
            expect(e).toEqual(new DeleteAppDataError("Error deleting app data"));
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });

    it("should emit the correct events when there is an error getting the app data", done => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new DeleteAppDataError("Error getting app data")),
        ),
      );

      const events: DeleteAppDataEvent[] = [];

      deleteAppDataUseCase(deleteAppDataFn).subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Should not complete"));
        },
        error: (e: Error) => {
          try {
            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({
              type: DeleteAppDataEventType.AppDataDeleteStarted,
            });
            expect(e).toEqual(new DeleteAppDataError("Error getting app data"));
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });

    it("should emit the correct events when there is an unknown error", done => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new Error("Unknown error")),
        ),
      );

      const events: DeleteAppDataEvent[] = [];

      deleteAppDataUseCase(deleteAppDataFn).subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Should not complete"));
        },
        error: (e: Error) => {
          try {
            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({
              type: DeleteAppDataEventType.AppDataDeleteStarted,
            });
            expect(e).toEqual(new Error("Unknown error"));
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });
  });
});
