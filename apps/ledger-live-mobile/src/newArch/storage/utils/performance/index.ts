import { STORAGE_TYPE } from "LLM/storage/constants";
import { Subject, Observable } from "rxjs";

type OperationType =
  | "get"
  | "getString"
  | "save"
  | "saveString"
  | "update"
  | "delete"
  | "deleteAll"
  | "push"
  | "keys"
  | "stringify";

type PerformanceRecord = {
  operation: OperationType;
  storageType: (typeof STORAGE_TYPE)[keyof typeof STORAGE_TYPE];
  startTime: number;
  endTime: number;
  duration: number;
  key: string;
  success: boolean;
};

class StoragePerformanceTracker {
  private static instance: StoragePerformanceTracker;
  private metrics: PerformanceRecord[] = [];
  private maxRecords = 500;
  private metricsSubject = new Subject<PerformanceRecord[]>();

  private constructor() {}

  static getInstance(): StoragePerformanceTracker {
    if (!StoragePerformanceTracker.instance) {
      StoragePerformanceTracker.instance = new StoragePerformanceTracker();
    }
    return StoragePerformanceTracker.instance;
  }

  startTracking(
    _operation: OperationType,
    _storageType: (typeof STORAGE_TYPE)[keyof typeof STORAGE_TYPE],
    _key: string | string[],
  ): number {
    return performance.now();
  }

  endTracking(
    operation: OperationType,
    storageType: (typeof STORAGE_TYPE)[keyof typeof STORAGE_TYPE],
    key: string | string[],
    startTime: number,
    success: boolean,
  ): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.unshift({
      operation,
      storageType,
      startTime,
      endTime,
      duration,
      key: Array.isArray(key) ? key.join(",") : key,
      success,
    });

    if (this.metrics.length > this.maxRecords) {
      this.metrics = this.metrics.slice(0, this.maxRecords);
    }

    this.metricsSubject.next([...this.metrics]);
  }

  getMetrics(): PerformanceRecord[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.metricsSubject.next([]);
  }

  getMetricsObservable(): Observable<PerformanceRecord[]> {
    return this.metricsSubject.asObservable();
  }
}

export const performanceTracker = StoragePerformanceTracker.getInstance();

export async function trackStorageOperation<T>(
  operation: OperationType,
  storageType: (typeof STORAGE_TYPE)[keyof typeof STORAGE_TYPE],
  key: string | string[],
  operationFn: () => Promise<T>,
): Promise<T> {
  const startTime = performanceTracker.startTracking(operation, storageType, key);

  try {
    const result = await operationFn();
    performanceTracker.endTracking(operation, storageType, key, startTime, true);
    return result;
  } catch (error) {
    performanceTracker.endTracking(operation, storageType, key, startTime, false);
    throw error;
  }
}
