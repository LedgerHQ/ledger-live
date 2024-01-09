import { StoreWrapper } from "./types";

type Measure = {
  name: string;
  duration: number;
  syncDuration: number;
  totalDuration: number;
  key: string;
};

const measures: Measure[] = [];

export function getMeasures(): Measure[] {
  return measures;
}

setInterval(() => {
  console.log(getMeasures());
}, 30000);

export function measureAsync<A extends unknown[], T, F extends (...args: A) => Promise<T>>(
  fn: F,
  name: string,
): (...args: A) => Promise<T> {
  return async (...a: A) => {
    const start = Date.now();
    const p = fn(...a);
    const endsync = Date.now();
    const result = await p;
    const end = Date.now();
    const duration = end - start;
    const key = String(typeof a[0] === "object" && Array.isArray(a[0]) ? a[0][0] : a[0]);
    measures.push({
      name,
      duration,
      syncDuration: endsync - start,
      totalDuration: end - start,
      key,
    });
    return result;
  };
}

export function decorateStats(impl: StoreWrapper): StoreWrapper {
  const res: StoreWrapper = {
    get: measureAsync(impl.get, "get"),
    save: measureAsync(impl.save, "save"),
    update: measureAsync(impl.update, "update"),
    delete: measureAsync(impl.delete, "delete"),
    keys: measureAsync(impl.keys, "keys"),
  };
  return res;
}
