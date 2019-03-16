// @flow
import type { Core } from "./types";

const GC_DELAY = 1000;

let core: ?Core;
let corePromise: ?Promise<Core>;
let libcoreJobsCounter = 0;
let lastFlush: Promise<void> = Promise.resolve();
let flushTimeout = null;

function flush(core: Core) {
  lastFlush = core.flush().catch(e => console.error("libcore-flush-fail", e));
}

export async function withLibcore<R>(
  job: (core: Core) => Promise<R>,
): Promise<R> {
  libcoreJobsCounter++;
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
    if (c && libcoreJobsCounter === 0) {
      flushTimeout = setTimeout(flush.bind(null, c), GC_DELAY);
    }
  }
}

type Fn<A, R> = (...args: A) => Promise<R>;

export const withLibcoreF = <A: Array<any>, R>(
  job: (core: Core) => Fn<A, R>,
): Fn<A, R> => (...args) => withLibcore(core => job(core)(...args));

let loadCoreImpl: ?() => Promise<Core>;

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
