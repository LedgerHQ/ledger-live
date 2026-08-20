import {
  ContactDeviceIntentBusyError,
  ContactDeviceIntentCancelledError,
  ContactDeviceIntentMissingResultError,
} from "../contactDeviceIntentsPort";
import type { ContactOperationOutcome } from "./types";

type ActiveRequest = {
  readonly id: number;
  outcome: ContactOperationOutcome<unknown>;
  readonly classify: (state: unknown) => ContactOperationOutcome<unknown>;
  readonly resolve: (result: unknown) => void;
  readonly reject: (error: unknown) => void;
};

export type StartedRequest<JobState, Result> = Readonly<{
  id: number;
  promise: Promise<Result>;
  capture: (state: JobState) => void;
  complete: () => boolean;
  fail: (error: unknown) => boolean;
}>;

export class SingleFlightRequestController {
  private activeRequest: ActiveRequest | undefined;
  private nextId = 0;

  start<JobState, Result>(
    classify: (state: JobState) => ContactOperationOutcome<Result>,
  ): StartedRequest<JobState, Result> {
    if (this.activeRequest !== undefined) {
      throw new ContactDeviceIntentBusyError();
    }

    const id = ++this.nextId;
    let resolvePromise!: (result: Result) => void;
    let rejectPromise!: (error: unknown) => void;
    const promise = new Promise<Result>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.activeRequest = {
      id,
      outcome: { type: "pending" },
      classify: state => classify(state as JobState),
      resolve: result => resolvePromise(result as Result),
      reject: rejectPromise,
    };

    return {
      id,
      promise,
      capture: state => {
        const request = this.getRequest(id);
        if (request !== undefined) {
          request.outcome = request.classify(state);
        }
      },
      complete: () => this.complete(id),
      fail: error => this.reject(id, error),
    };
  }

  cancel(): boolean {
    const request = this.activeRequest;
    if (request === undefined) {
      return false;
    }
    this.activeRequest = undefined;
    request.reject(new ContactDeviceIntentCancelledError());
    return true;
  }

  private complete(id: number): boolean {
    const request = this.getRequest(id);
    if (request === undefined) {
      return false;
    }

    this.activeRequest = undefined;
    switch (request.outcome.type) {
      case "success":
        request.resolve(request.outcome.result);
        break;
      case "failure":
        request.reject(request.outcome.error);
        break;
      case "pending":
        request.reject(new ContactDeviceIntentMissingResultError());
        break;
    }
    return true;
  }

  private reject(id: number, error: unknown): boolean {
    const request = this.getRequest(id);
    if (request === undefined) {
      return false;
    }
    this.activeRequest = undefined;
    request.reject(error);
    return true;
  }

  private getRequest(id: number): ActiveRequest | undefined {
    return this.activeRequest?.id === id ? this.activeRequest : undefined;
  }
}
