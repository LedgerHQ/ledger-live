import { Observable, Subject, of, takeUntil } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import type {
  DeviceActionState,
  ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceLockedError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type {
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue,
} from "@ledgerhq/live-dmk-shared";
import { DisconnectedDevice } from "@ledgerhq/errors";

import { LockedDeviceEvent } from "./actions/types";

export class PrepareConnectManagerEventMapper {
  private eventSubject = new Subject<LockedDeviceEvent>();

  constructor(
    private events: ExecuteDeviceActionReturnType<
      PrepareConnectManagerDAOutput,
      PrepareConnectManagerDAError,
      PrepareConnectManagerDAIntermediateValue
    >,
  ) {}

  map(): Observable<LockedDeviceEvent> {
    const cancelAction = this.events.cancel;
    const unsubscribe = new Subject<void>();

    // Subscribe to device action events
    this.events.observable
      .pipe(
        tap(event => this.handleEvent(event)),
        takeUntil(unsubscribe),
        catchError(error => this.handleError(error)),
      )
      .subscribe();

    return new Observable<LockedDeviceEvent>(observer => {
      const sub = this.eventSubject.subscribe(observer);
      return () => {
        sub.unsubscribe();
        cancelAction();
        unsubscribe.next();
      };
    });
  }

  private handleEvent(
    event: DeviceActionState<
      PrepareConnectManagerDAOutput,
      PrepareConnectManagerDAError,
      PrepareConnectManagerDAIntermediateValue
    >,
  ): void {
    switch (event.status) {
      case DeviceActionStatus.Pending:
        this.handlePendingEvent(event.intermediateValue);
        break;
      case DeviceActionStatus.Completed:
        this.handleCompletedEvent(event.output);
        break;
      case DeviceActionStatus.Error:
        this.handleErrorEvent(event.error);
        break;
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Stopped:
        this.eventSubject.error(new Error("Unexpected device action status"));
        break;
    }
  }

  private handlePendingEvent(intermediateValue: PrepareConnectManagerDAIntermediateValue): void {
    switch (intermediateValue.requiredUserInteraction) {
      case UserInteractionRequired.UnlockDevice:
        this.eventSubject.next({ type: "lockedDevice" });
        break;
      case UserInteractionRequired.None:
        // Nothing to do
        break;
    }
  }

  private handleCompletedEvent(_output: PrepareConnectManagerDAOutput): void {
    this.eventSubject.complete();
  }

  private handleErrorEvent(error: PrepareConnectManagerDAError): void {
    if (error instanceof DeviceLockedError) {
      this.eventSubject.next({ type: "lockedDevice" });
      this.eventSubject.complete();
    } else if ("_tag" in error && error._tag === "WebHidSendReportError") {
      this.eventSubject.error(new DisconnectedDevice());
    } else {
      this.eventSubject.error(error);
    }
  }

  private handleError(error: Error): Observable<never> {
    this.eventSubject.error(error);
    return of();
  }
}
