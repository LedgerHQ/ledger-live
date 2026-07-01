/**
 * A real async mutex serializing device-touching MCP tools. Unlike
 * `withWalletCliDeviceInterruptScope` (a counter used only to gate SIGINT USB teardown),
 * the long-lived MCP server must guarantee a single in-flight device operation: two
 * concurrent `receive --verify` / `send` / `swap_execute` / `genuine_check` calls would
 * otherwise both try to drive the one connected Ledger over USB and interleave APDUs.
 *
 * Callers acquire the lock, run their device work, then release. Waiters are served in FIFO
 * order. Release is idempotent-safe via the returned single-use function.
 */
export class DeviceLock {
  private _locked = false;
  private readonly _waiters: Array<() => void> = [];

  /** True while a device operation holds the lock. */
  get isLocked(): boolean {
    return this._locked;
  }

  /** Acquire the lock, resolving to a single-use release function. */
  async acquire(): Promise<() => void> {
    if (this._locked) {
      await new Promise<void>(resolve => {
        this._waiters.push(resolve);
      });
    }
    this._locked = true;
    return this._makeRelease();
  }

  private _makeRelease(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this._waiters.shift();
      if (next) {
        // Hand the lock straight to the next waiter without dropping `_locked`,
        // so no third caller can slip in between release and the waiter resuming.
        next();
        return;
      }
      this._locked = false;
    };
  }

  /** Run `fn` while holding the lock, releasing it even if `fn` throws. */
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

/** Process-wide device lock shared by all MCP device-touching tools. */
export const deviceLock = new DeviceLock();
