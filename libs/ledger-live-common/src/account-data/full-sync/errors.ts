export class FullSyncAccountNotFoundError extends Error {
  override name = "FullSyncAccountNotFoundError";
}

/** The transaction or signature a payload names is gone, after a restart: prepare again. */
export class FullSyncSendExpiredError extends Error {
  override name = "FullSyncSendExpiredError";
}
