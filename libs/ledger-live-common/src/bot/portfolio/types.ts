import { AppSpec } from "../types";

export type NetworkAuditResult = {
  totalTime?: number;
  totalCount?: number;
  totalResponseSize?: number;
  totalDuplicateRequests?: number;
};

export type AuditResult = {
  jsBootTime: number;
  cpuUserTime: number;
  cpuSystemTime: number;
  totalTime: number;
  memoryEnd: NodeJS.MemoryUsage;
  memoryStart: NodeJS.MemoryUsage;
  accountsJSONSize?: number;
  preloadJSONSize?: number;
  network: NetworkAuditResult;
  slowFrames: {
    count: number;
    duration: number;
  };
};

export type Report = {
  error?: string;
  refillAddress?: string | undefined;
  accountIds?: string[];
  accountBalances?: string[];
  accountOperationsLength?: number[];
  auditResult?: AuditResult;
};

export type SpecPerBot = {
  seed: string;
  env: Record<string, string>;
  spec: AppSpec<any>;
  family: string;
  key: string;
};
