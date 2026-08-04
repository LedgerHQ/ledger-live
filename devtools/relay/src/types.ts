export type Logger = {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  trace: (msg: string) => void;
  /** Raw write — no newline appended. Used for QR code output. */
  write: (s: string) => void;
  close: () => void;
};

export type LanIpResolver = () => string | null;
