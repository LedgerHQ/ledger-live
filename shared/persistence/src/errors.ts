export class RecordDecodeError extends Error {
  override name = "RecordDecodeError";
  readonly key: string;
  readonly version: number;
  constructor(key: string, version: number, reason: string) {
    super(`Stored value of record "${key}" v${version} does not match its schema: ${reason}`);
    this.key = key;
    this.version = version;
  }
}

/** A newer app stored this value: this app keeps it stored and does not read it. */
export class NewerRecordVersionError extends Error {
  override name = "NewerRecordVersionError";
  readonly key: string;
  readonly version: number;
  readonly storedVersion: number;
  constructor(key: string, version: number, storedVersion: number) {
    super(`Stored value of record "${key}" is v${storedVersion}, newer than the known v${version}`);
    this.key = key;
    this.version = version;
    this.storedVersion = storedVersion;
  }
}
