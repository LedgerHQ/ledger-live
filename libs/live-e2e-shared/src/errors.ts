export class BroadcastLockStoreFatalError extends Error {
  override name = "BroadcastLockStoreFatalError";
}

export class BroadcastLockStoreDownError extends Error {
  override name = "BroadcastLockStoreDownError";
}

export class BroadcastLockConfigError extends Error {
  override name = "BroadcastLockConfigError";
}

export class BroadcastLockLostError extends Error {
  override name = "BroadcastLockLostError";
}

export class BroadcastLockRefusedError extends Error {
  override name = "BroadcastLockRefusedError";
}

export class BroadcastLockBusyError extends Error {
  override name = "BroadcastLockBusyError";
}
