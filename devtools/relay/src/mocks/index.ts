import type { Logger, LanIpResolver } from "../types";

export function createMockLogger(): Logger {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
  };
}

export const nullLanIp: LanIpResolver = () => null;
