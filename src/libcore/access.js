// @flow
import { Subject, Observable } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import type { Core } from "./types";

const GC_DELAY = 1000;

let core: ?Core;
let corePromise: ?Promise<Core>;
let libcoreJobsCounter = 0;
let lastFlush: Promise<void> = Promise.resolve();
let flushTimeout = null;
const libcoreJobsCounterSubject: Subject<number> = new Subject();
export const libcoreJobBusy: Observable<boolean> = libcoreJobsCounterSubject.pipe(
  map(v => v > 0),
  distinctUntilChanged()
);

type AfterGCJob<R> = {
  job: Core => Promise<R>,
  resolve: R => void
};
const afterLibcoreFlushes: Array<AfterGCJob<any>> = [];

function flush(c: Core) {
  lastFlush = c
    .flush()
    .then(async () => {
      let item;
      while ((item = afterLibcoreFlushes.shift())) {
        item.resolve(await item.job(c));
      }
    })
    .catch(e => console.error("libcore-flush-fail", e));
}

export async function afterLibcoreGC<R>(
  job: (core: Core) => Promise<R>
): Promise<R> {
  return new Promise(resolve => {
    afterLibcoreFlushes.push({ job, resolve });
  });
}

export async function withLibcore<R>(
  job: (core: Core) => Promise<R>
): Promise<R> {
  libcoreJobsCounter++;
  libcoreJobsCounterSubject.next(libcoreJobsCounter);
  let c: ?Core;
  try {
    if (flushTimeout) {
      // there is a new job so we must not do the GC yet.
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    c = await load();
    await lastFlush; // wait previous flush before starting anything
    const res = await job(c);
    return res;
  } finally {
    libcoreJobsCounter--;
    libcoreJobsCounterSubject.next(libcoreJobsCounter);
    if (c && libcoreJobsCounter === 0) {
      flushTimeout = setTimeout(flush.bind(null, c), GC_DELAY);
    }
  }
}

type Fn<A, R> = (...args: A) => Promise<R>;

export const withLibcoreF = <A: Array<any>, R>(
  job: (core: Core) => Fn<A, R>
): Fn<A, R> => (...args) => withLibcore(c => job(c)(...args));

let loadCoreImpl: ?() => Promise<Core>;

// reset the libcore data
export async function reset() {
  if (!core) return;
  await core.getPoolInstance().freshResetAll();
  core = null;
  corePromise = null;
}

async function load(): Promise<Core> {
  if (core) {
    return core;
  }
  if (!corePromise) {
    if (!loadCoreImpl) {
      console.warn("loadCore implementation is missing");
      throw new Error("loadCoreImpl missing");
    }
    corePromise = loadCoreImpl();
  }
  core = await corePromise;
  return core;
}

export function setLoadCoreImplementation(loadCore: () => Promise<Core>) {
  loadCoreImpl = loadCore;
}
