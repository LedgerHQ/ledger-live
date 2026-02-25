/* eslint-disable @typescript-eslint/consistent-type-assertions */
import http, { ClientRequest } from "node:http";
import https from "node:https";

export type Dist = {
  min: number;
  average: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
};

type MeasureResult<T> = {
  result: T;
  totalCalls: number;
  callsByDomain: Record<string, number>;
  cpu: Dist;
  memory: Dist;
};

function average(values: number[]): number {
  return values.reduce((previous, current) => previous + current) / values.length;
}

function computeStats(values: number[]): Dist {
  if (values.length === 0) {
    return { min: 0, average: 0, max: 0, p90: 0, p99: 0, p50: 0, p95: 0 };
  }

  const sortedValues = values.slice().sort((a, b) => a - b);
  const valuesCount = sortedValues.length;

  const quantile = (p: number) => {
    const rank = Math.ceil((p / 100) * valuesCount);
    const index = Math.min(Math.max(rank - 1, 0), valuesCount - 1);
    return sortedValues[index];
  };

  return {
    min: sortedValues[0],
    average: average(values),
    max: sortedValues[valuesCount - 1],
    p50: quantile(50),
    p90: quantile(90),
    p95: quantile(95),
    p99: quantile(99),
  };
}

function cpuPercentDelta(diffUserUs: number, diffSysUs: number, elapsedMs: number) {
  const totalMs = (diffUserUs + diffSysUs) / 1000;
  return elapsedMs > 0 ? (totalMs / elapsedMs) * 100 : 0;
}

function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

function setImmediateInterval(fn: () => unknown, ms: number) {
  return setInterval(
    (() => {
      fn();
      return fn;
    })(),
    ms,
  );
}

async function measureDuring<T>(fn: () => Promise<T>) {
  const cpuSamples: number[] = [];
  const memSamples: number[] = [];

  let prevCpu = process.cpuUsage();
  let prevTs = Date.now();

  const { rss: previousMemory } = process.memoryUsage();

  const tick = () => {
    const now = Date.now();
    const elapsed = now - prevTs;

    const curCpu = process.cpuUsage();
    const diffUser = curCpu.user - prevCpu.user;
    const diffSys = curCpu.system - prevCpu.system;

    const cpu = cpuPercentDelta(diffUser, diffSys, elapsed);
    cpuSamples.push(cpu);

    const { rss } = process.memoryUsage();
    memSamples.push(bytesToMB(Math.max(rss - previousMemory, 0)));

    prevCpu = curCpu;
    prevTs = now;
  };

  const timer = setImmediateInterval(tick, 30);

  try {
    const result = await fn();
    clearInterval(timer);

    return { result, cpuSamples, memSamples };
  } catch (err) {
    clearInterval(timer);
    throw err;
  }
}

type CallCounter = {
  start: () => void;
  stop: () => void;
  reset: () => void;
  snapshot: () => Record<string, number>;
  total: () => number;
};

function createCallCounter(): CallCounter {
  const counters: Record<string, number> = {};
  let started = false;

  const originalHttpRequest = http.request;
  const originalHttpsRequest = https.request;
  const originalFetch = globalThis.fetch;

  function start() {
    if (started) return;

    http.request = patchedRequestOnHttp;
    https.request = patchedRequestOnHttps;
    globalThis.fetch = patchedFetch;

    started = true;
  }

  function bump(url: string): void {
    const key = new URL(url).hostname;
    counters[key] = (counters[key] ?? 0) + 1;
  }

  const patchedRequestOnHttp: typeof http.request = (...args: unknown[]) => {
    const request: ClientRequest = originalHttpRequest.apply(http, args as never);
    bump(request.protocol + "//" + request.host + request.path);
    return request;
  };

  const patchedRequestOnHttps: typeof https.request = (...args: unknown[]) => {
    const request: ClientRequest = originalHttpsRequest.apply(https, args as never);
    bump(request.protocol + "//" + request.host + request.path);
    return request;
  };

  const patchedFetch: typeof globalThis.fetch = (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof Request ? input.url : input.href;
    bump(url);
    return originalFetch(input, init);
  };

  function stop() {
    if (!started) return;
    http.request = originalHttpRequest;
    https.request = originalHttpsRequest;
    globalThis.fetch = originalFetch;

    started = false;
  }

  function reset() {
    for (const k in counters) delete counters[k];
  }

  function snapshot() {
    return { ...counters };
  }

  function total() {
    return Object.values(counters).reduce((sum, v) => sum + v, 0);
  }

  return { start, stop, reset, snapshot, total };
}

export async function measureCalls<T>(phase: () => Promise<T>): Promise<MeasureResult<T>> {
  const localCounter = createCallCounter();

  localCounter.reset();
  localCounter.start();

  try {
    const { result, cpuSamples, memSamples } = await measureDuring(() => phase());
    localCounter.stop();

    return {
      result,
      totalCalls: localCounter.total(),
      callsByDomain: localCounter.snapshot(),
      cpu: computeStats(cpuSamples),
      memory: computeStats(memSamples),
    };
  } catch (err) {
    localCounter.stop();
    throw err;
  }
}
