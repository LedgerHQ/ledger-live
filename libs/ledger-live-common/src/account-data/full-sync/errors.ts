export class FullSyncAccountNotFoundError extends Error {
  override name = "FullSyncAccountNotFoundError";
}

/** The transaction or signature a payload names is gone, after a restart: prepare again. */
export class FullSyncSendExpiredError extends Error {
  override name = "FullSyncSendExpiredError";
}

/** What the account would send changed since the summary was shown (a send-max after a balance change): prepare again. */
export class FullSyncSendOutdatedError extends Error {
  override name = "FullSyncSendOutdatedError";
}
