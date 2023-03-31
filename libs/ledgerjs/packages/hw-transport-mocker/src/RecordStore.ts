/**
 * thrown by the RecordStore.fromString parser.
 */
export function RecordStoreInvalidSynthax(message: string) {
  this.name = "RecordStoreInvalidSynthax";
  this.message = message;
  this.stack = new Error().stack;
}

RecordStoreInvalidSynthax.prototype = new Error();

/**
 * thrown by the replayer if the queue is empty
 */
export function RecordStoreQueueEmpty() {
  this.name = "RecordStoreQueueEmpty";
  this.message = "EOF: no more APDU to replay";
  this.stack = new Error().stack;
}

RecordStoreQueueEmpty.prototype = new Error();

/**
 * thrown by replayer if it meets an unexpected apdu
 */
export function RecordStoreWrongAPDU(
  expected: string,
  got: string,
  line: number
) {
  this.name = "RecordStoreWrongAPDU";
  this.message = `wrong apdu to replay line ${line}. Expected ${expected}, Got ${got}`;
  this.expectedAPDU = expected;
  this.gotAPDU = got;
  this.stack = new Error().stack;
}

RecordStoreWrongAPDU.prototype = new Error();

/**
 * thrown by ensureQueueEmpty
 */
export function RecordStoreRemainingAPDU(expected: string): void {
  this.name = "RecordStoreRemainingAPDU";
  this.message = `replay expected more APDUs to come:\n${expected}`;
  this.stack = new Error().stack;
}

RecordStoreRemainingAPDU.prototype = new Error();
export type Queue = [string, string][];

/**
 * - autoSkipUnknownApdu:
 * smart mechanism that would skip an apdu un-recognize to the next one that does
 * this is meant to be used when you have refactored/dropped some APDUs
 * it will produces warnings for you to fix the APDUs queue
 * - warning:
 * allows to override the warning function (defaults to console.warn)
 */
export type RecordStoreOptions = {
  autoSkipUnknownApdu: boolean;
  warning: (arg0: string) => void;
};
const defaultOpts: RecordStoreOptions = {
  autoSkipUnknownApdu: false,
  warning: (log) => console.warn(log),
};

/**
 * a RecordStore is a stateful object that represents a queue of APDUs.
 * It is both used by replayer and recorder transports and is the basic for writing Ledger tests with a mock device.
 */
export class RecordStore {
  passed = 0;
  queue: Queue;
  opts: RecordStoreOptions;

  constructor(
    queue?: Queue | null | undefined,
    opts?: Partial<RecordStoreOptions>
  ) {
    this.queue = queue || [];
    this.opts = { ...defaultOpts, ...opts };
  }

  /**
   * check if there is no more APDUs to replay
   */
  isEmpty = (): boolean => this.queue.length === 0;

  /**
   * Record an APDU (used by createTransportRecorder)
   * @param {Buffer} apdu input
   * @param {Buffer} out response
   */
  recordExchange(apdu: Buffer, out: Buffer): void {
    this.queue.push([apdu.toString("hex"), out.toString("hex")]);
  }

  /**
   * Replay an APDU (used by createTransportReplayer)
   * @param apdu
   */
  replayExchange(apdu: Buffer): Buffer {
    const { queue, opts } = this;
    const apduHex = apdu.toString("hex");

    for (let i = 0; i < queue.length; i++) {
      const head = queue[i];
      const line = 2 * (this.passed + i);

      if (apduHex === head[0]) {
        ++this.passed;
        this.queue = queue.slice(i + 1);
        return Buffer.from(head[1], "hex");
      } else {
        if (opts.autoSkipUnknownApdu) {
          opts.warning(
            "skipped unmatched apdu (line " +
              line +
              " – expected " +
              head[0] +
              ")"
          );
          ++this.passed;
        } else {
          throw new RecordStoreWrongAPDU(head[0], apduHex, line);
        }
      }
    }

    this.queue = [];
    throw new RecordStoreQueueEmpty();
  }

  /**
   * Check all APDUs was replayed. Throw if it's not the case.
   */
  ensureQueueEmpty(): void {
    if (!this.isEmpty()) {
      throw new RecordStoreRemainingAPDU(this.toString());
    }
  }

  /**
   * Print out the series of apdus
   */
  toString(): string {
    return (
      this.queue
        .map(([send, receive]) => `=> ${send}\n<= ${receive}`)
        .join("\n") + "\n"
    );
  }

  /**
   * Create a RecordStore by parsing a string (a series of => HEX\n<= HEX)
   * @param {string} series of APDUs
   * @param {$Shape<RecordStoreOptions>} opts
   */
  static fromString(
    str: string,
    opts?: Partial<RecordStoreOptions>
  ): RecordStore {
    const queue: Queue = [];
    let value: string[] = [];
    str
      .split("\n")
      .map((line) => line.replace(/ /g, ""))
      .filter((o) => o)
      .forEach((line) => {
        if (value.length === 0) {
          const m = line.match(/^=>([0-9a-fA-F]+)$/);

          if (!m) {
            throw new RecordStoreInvalidSynthax("expected an apdu input");
          }

          value.push(m[1]);
        } else {
          const m = line.match(/^<=([0-9a-fA-F]+)$/);

          if (!m) {
            throw new RecordStoreInvalidSynthax("expected an apdu output");
          }

          value.push(m[1]);
          queue.push([value[0], value[1]]);
          value = [];
        }
      });

    if (value.length !== 0) {
      throw new RecordStoreInvalidSynthax("unexpected end of file");
    }

    return new RecordStore(queue, opts);
  }
}
