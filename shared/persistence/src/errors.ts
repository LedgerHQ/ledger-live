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
