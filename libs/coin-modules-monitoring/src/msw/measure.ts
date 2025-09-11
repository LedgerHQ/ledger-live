import { resetCounters, snapshotCounters, totalCalls } from "./server";

export type Dist = {
  min: number;
  median: number;
  max: number;
  p90: number;
  p99: number;
};

type MeasureResult<T> = {
  result: T;
  total: number;
  callsByDomain: Record<string, number>;
  cpu: Dist;
  memory: Dist;
};

function computeStats(values: number[]): Dist {
  if (values.length === 0) {
    return { min: 0, median: 0, max: 0, p90: 0, p99: 0 };
  }

  const arr = values.sort((a, b) => a - b);
  const n = arr.length;

  const quantile = (p: number) => {
    const rank = Math.ceil((p / 100) * n);
    const idx = Math.min(Math.max(rank - 1, 0), n - 1);
    return arr[idx];
  };

  const median = n % 2 === 1 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;

  return {
    min: arr[0],
    median,
    max: arr[n - 1],
    p90: quantile(90),
    p99: quantile(99),
  };
}

function cpuPercentDelta(diffUserUs: number, diffSysUs: number, elapsedMs: number) {
  const totalMs = (diffUserUs + diffSysUs) / 1000;
  return elapsedMs > 0 ? (totalMs / elapsedMs) * 100 : 0;
}

function bytesToMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

async function measureDuring<T>(fn: () => Promise<T>, periodMs = 1000) {
  const cpuSamples: number[] = [];
  const memSamples: number[] = [];

  let prevCpu = process.cpuUsage();
  let prevTs = Date.now();

  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    if (stopped) return;

    const now = Date.now();
    const elapsed = now - prevTs;

    const curCpu = process.cpuUsage();
    const diffUser = curCpu.user - prevCpu.user;
    const diffSys = curCpu.system - prevCpu.system;

    const cpu = cpuPercentDelta(diffUser, diffSys, elapsed);
    const { rss } = process.memoryUsage();

    cpuSamples.push(Math.round(cpu * 100) / 100);
    memSamples.push(bytesToMB(rss));

    prevCpu = curCpu;
    prevTs = now;

    timer = setTimeout(tick, periodMs);
  };

  timer = setTimeout(tick, periodMs);

  const result = await fn();

  await new Promise(r => setTimeout(r, periodMs));

  stopped = true;
  if (timer) clearTimeout(timer);

  return { result, cpuSamples, memSamples };
}

export async function measureCalls<T>(
  phase: () => Promise<T>,
  sampleEveryMs = 100,
): Promise<MeasureResult<T>> {
  resetCounters();

  const { result, cpuSamples, memSamples } = await measureDuring(() => phase(), sampleEveryMs);

  return {
    result,
    total: totalCalls(),
    callsByDomain: snapshotCounters(),
    cpu: computeStats(cpuSamples),
    memory: computeStats(memSamples),
  };
}
