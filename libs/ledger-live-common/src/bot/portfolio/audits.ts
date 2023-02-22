import {
  PerformanceObserver,
  PerformanceObserverCallback,
} from "node:perf_hooks";
import { AuditResult, NetworkAuditResult } from "./types";

export class SlowFrameDetector {
  _count = 0;
  _duration = 0;
  _threshold: number;
  _interval: NodeJS.Timeout | undefined;

  constructor(threshold = 200) {
    this._threshold = threshold;
  }

  start(): void {
    if (this._interval) {
      throw new Error("already started");
    }
    let lastFrame = Date.now();
    this._interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastFrame;
      if (diff > this._threshold) {
        this._count++;
        this._duration += diff;
      }
      lastFrame = now;
    }, 10);
  }

  stop(): void {
    if (!this._interval) {
      throw new Error("not started");
    }
    clearInterval(this._interval);
    this._interval = undefined;
  }

  result(): { count: number; duration: number } {
    return {
      count: this._count,
      duration: this._duration,
    };
  }
}

// all the logic to measure and report back
export class Audit {
  _jsBootTime: number;
  _startTime: [number, number];
  _startUsage: NodeJS.CpuUsage;
  _startMemory: NodeJS.MemoryUsage;
  _slowFrameDetector: SlowFrameDetector;
  _networkAudit: NetworkAudit;

  constructor() {
    const jsBootTime = Date.now() - parseInt(process.env.START_TIME || "0", 10);
    this._jsBootTime = jsBootTime;
    this._startTime = process.hrtime();
    this._startUsage = process.cpuUsage();
    this._startMemory = process.memoryUsage();
    this._slowFrameDetector = new SlowFrameDetector();
    this._slowFrameDetector.start();
    this._networkAudit = new NetworkAudit();
    this._networkAudit.start();
  }

  _totalTime: number | undefined;
  _cpuUserTime: number | undefined;
  _cpuSystemTime: number | undefined;
  _endMemory: NodeJS.MemoryUsage | undefined;

  end(): void {
    const endTime = process.hrtime(this._startTime);
    const endUsage = process.cpuUsage(this._startUsage);
    const endMemory = process.memoryUsage();
    this._totalTime = (endTime[0] * 1e9 + endTime[1]) / 1e6; // ms
    this._cpuUserTime = endUsage.user / 1e3; // ms
    this._cpuSystemTime = endUsage.system / 1e3; // ms
    this._endMemory = endMemory;
    this._slowFrameDetector.stop();
    this._networkAudit.stop();
  }

  _accountsJSONSize: number | undefined;
  setAccountsJSONSize(size: number): void {
    this._accountsJSONSize = size;
  }
  _preloadJSONSize: number | undefined;
  setPreloadJSONSize(size: number): void {
    this._preloadJSONSize = size;
  }

  result(): AuditResult {
    if (!this._totalTime) {
      throw new Error("audit not ended");
    }
    return {
      jsBootTime: this._jsBootTime,
      cpuUserTime: this._cpuUserTime!,
      cpuSystemTime: this._cpuSystemTime!,
      totalTime: this._totalTime,
      memoryEnd: this._endMemory!,
      memoryStart: this._startMemory,
      accountsJSONSize: this._accountsJSONSize,
      preloadJSONSize: this._preloadJSONSize,
      network: this._networkAudit.result(),
      slowFrames: this._slowFrameDetector.result(),
    };
  }
}

export class NetworkAudit {
  _obs: PerformanceObserver | undefined;
  _totalTime = 0;
  _totalCount = 0;
  _totalResponseSize = 0;
  _totalDuplicateRequests = 0;
  _urlsSeen = new Set<string>();

  start(): void {
    this._obs = new PerformanceObserver(this.onPerformanceEntry);
    this._obs.observe({ type: "http" });
  }

  stop(): void {
    if (this._obs) {
      this._obs.disconnect();
      this._obs = undefined;
    }
  }

  onPerformanceEntry: PerformanceObserverCallback = (items, _observer) => {
    const entries = items.getEntries();
    for (const entry of entries) {
      if (entry.entryType === "http") {
        this._totalCount = (this._totalCount || 0) + 1;
        if (entry.duration) {
          this._totalTime = (this._totalTime || 0) + entry.duration;
        }
        const req = (entry.detail as any)?.req;
        const res = (entry.detail as any)?.res;
        if (res && req) {
          const { url } = req;
          if (this._urlsSeen.has(url)) {
            this._totalDuplicateRequests =
              (this._totalDuplicateRequests || 0) + 1;
          } else {
            this._urlsSeen.add(url);
          }
          const { headers } = res;

          if (headers) {
            const contentLength = headers["content-length"];
            if (contentLength) {
              this._totalResponseSize =
                (this._totalResponseSize || 0) + parseInt(contentLength);
            }
          }
        }
      }
    }
  };

  result(): NetworkAuditResult {
    return {
      totalTime: this._totalTime,
      totalCount: this._totalCount,
      totalResponseSize: this._totalResponseSize,
      totalDuplicateRequests: this._totalDuplicateRequests,
    };
  }
}
