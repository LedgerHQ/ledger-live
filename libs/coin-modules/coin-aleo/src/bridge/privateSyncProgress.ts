// This module defines a Subject that emits events related to the progress of private synchronization for Aleo accounts.
// Each event includes the account ID and the current progress percentage (or null if progress is not available).
// This allows different parts of the application to subscribe to these events and react accordingly,
// such as updating UI components or triggering other actions based on the synchronization status of Aleo accounts.

import { Subject } from "rxjs";

export interface AleoPrivateSyncProgressEvent {
  accountId: string;
  progress: number | null;
}

export const aleoPrivateSyncProgress$ = new Subject<AleoPrivateSyncProgressEvent>();
