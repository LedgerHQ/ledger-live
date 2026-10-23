export class ExclusiveLockStoreFatalError extends Error {
  override name = "ExclusiveLockStoreFatalError";
}

export class ExclusiveLockStoreDownError extends Error {
  override name = "ExclusiveLockStoreDownError";
}

export class ExclusiveLockConfigError extends Error {
  override name = "ExclusiveLockConfigError";
}

export class ExclusiveLockLostError extends Error {
  override name = "ExclusiveLockLostError";
}

export class ExclusiveLockRefusedError extends Error {
  override name = "ExclusiveLockRefusedError";
}

export class ExclusiveLockBusyError extends Error {
  override name = "ExclusiveLockBusyError";
}
