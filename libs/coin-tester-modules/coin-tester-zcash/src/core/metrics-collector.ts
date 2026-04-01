export interface SyncMetrics {
  totalSyncTimeMs: number;
  blocksProcessed: number;
  timePerBlockMs: number;
  shieldedTxFound: number;
  peakMemoryMb: number;
  avgMemoryMb: number;
  throughput: { blocksPerSecond: number };
}

export class MetricsCollector {
  private startTime = 0;
  private memSamples: number[] = [];
  private samplerInterval?: ReturnType<typeof setInterval>;
  private blocksProcessed = 0;
  private shieldedTxFound = 0;

  start(): void {
    this.startTime = Date.now();
    this.memSamples = [];
    this.samplerInterval = setInterval(() => {
      const mb = process.memoryUsage().heapUsed / 1024 / 1024;
      this.memSamples.push(mb);
    }, 500).unref();
  }

  recordBlocks(count: number): void {
    this.blocksProcessed += count;
  }

  recordShieldedTx(count: number): void {
    this.shieldedTxFound += count;
  }

  stop(): SyncMetrics {
    const totalSyncTimeMs = Date.now() - this.startTime;
    if (this.samplerInterval) clearInterval(this.samplerInterval);

    const peakMemoryMb =
      this.memSamples.length > 0
        ? Math.max(...this.memSamples)
        : process.memoryUsage().heapUsed / 1024 / 1024;
    const avgMemoryMb =
      this.memSamples.length > 0
        ? this.memSamples.reduce((a, b) => a + b, 0) / this.memSamples.length
        : peakMemoryMb;

    const timePerBlockMs = this.blocksProcessed > 0 ? totalSyncTimeMs / this.blocksProcessed : 0;

    return {
      totalSyncTimeMs,
      blocksProcessed: this.blocksProcessed,
      timePerBlockMs,
      shieldedTxFound: this.shieldedTxFound,
      peakMemoryMb,
      avgMemoryMb,
      throughput: {
        blocksPerSecond: totalSyncTimeMs > 0 ? (this.blocksProcessed / totalSyncTimeMs) * 1000 : 0,
      },
    };
  }
}
