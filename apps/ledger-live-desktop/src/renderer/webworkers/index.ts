import React from "react";

const workers = new Map<string, Worker>();

export async function initWorker(path: string, alias?: string) {
  let workerPath = path;
  if (!__DEV__) {
    // In development, vite.js is smart enough to load the worker directly
    // In production, we bundle the worker into a single file using esbuild
    // The location of the file is ./[file].worker.js, so we need to rewrite the path
    workerPath = workerPath.split("/").slice(-1)[0];
    if (workerPath.endsWith(".ts")) {
      workerPath = workerPath.replace(".ts", ".worker.js");
    } else if (workerPath.endsWith(".js")) {
      workerPath = workerPath.replace(".js", ".worker.js");
    } else {
      workerPath = workerPath + ".worker.js";
    }
  }
  const worker = new Worker(workerPath, { type: "module" });
  workers.set(alias ?? path, worker);
  return worker;
}

export function getWorker(pathOrAlias: string) {
  return workers.get(pathOrAlias);
}

export function disposeWorker(pathOrAlias: string) {
  const worker = workers.get(pathOrAlias);
  if (worker) {
    worker.terminate();
    workers.delete(pathOrAlias);
  }
}

export function useWorker(workerPath: string, onMessage: (e: MessageEvent) => void): void;
export function useWorker(
  workerPath: string,
  workerAlias: string,
  onMessage: (e: MessageEvent) => void,
): void;
export function useWorker(
  workerPath: string,
  workerAliasOrOnMessage: string | ((e: MessageEvent) => void),
  maybeOnMessage?: (e: MessageEvent) => void,
): void {
  const workerAlias =
    typeof workerAliasOrOnMessage === "string" ? workerAliasOrOnMessage : undefined;
  const onMessage =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    typeof workerAliasOrOnMessage !== "string" ? workerAliasOrOnMessage : maybeOnMessage!;

  const effectCounter = React.useRef(0);
  React.useEffect(() => {
    let worker: Worker | null = null;
    const currentCounter = ++effectCounter.current;
    // eslint-disable-next-line
    initWorker(workerPath, workerAlias).then(w => {
      if (effectCounter.current !== currentCounter) {
        // Worker was initialized after the effect was unmounted
        w.terminate();
      } else {
        worker = w;
        worker.onmessage = onMessage;
      }
    });
    return () => {
      worker && worker.terminate();
    };
  }, [workerPath, workerAlias, onMessage]);
}
