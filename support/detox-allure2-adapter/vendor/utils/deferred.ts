export class Deferred<T> {
  public promise: Promise<void>;
  private _resolve!: () => void;
  private _settled = false;
  private _timeout: NodeJS.Timeout;
  private _cleanup: () => void;
  private _predicate: (value: T) => boolean;

  constructor({
    timeoutMs,
    predicate,
    cleanup,
  }: {
    timeoutMs: number;
    predicate: (value: T) => boolean;
    cleanup: () => void;
  }) {
    this._predicate = predicate;
    this._cleanup = cleanup;
    this.promise = new Promise<void>((resolve) => {
      this._resolve = () => {
        if (!this._settled) {
          this._settled = true;
          clearTimeout(this._timeout);
          this._cleanup();
          resolve();
        }
      };
    });
    this._timeout = setTimeout(() => {
      this._resolve();
    }, timeoutMs);
  }

  update(value: T) {
    if (this._settled) return;
    if (this._predicate(value)) {
      this._resolve();
    }
  }
}
