// SPIKE rn88: React Native 0.88 removed InteractionManager (Release builds export undefined, __DEV__ throws).
// The app imports InteractionManager from here; index.js also loads this file first so
// react-native-draggable-flatlist, which still calls InteractionManager.runAfterInteractions, keeps working.
type InteractionTask = (() => unknown) | { name: string; gen: () => unknown };

type InteractionPromise = {
  then: (onFulfilled?: () => unknown, onRejected?: () => unknown) => Promise<unknown>;
  done: (onFulfilled?: () => unknown, onRejected?: () => unknown) => Promise<unknown>;
  cancel: () => void;
};

const scheduleIdle = (callback: () => void) =>
  typeof globalThis.requestIdleCallback === "function"
    ? globalThis.requestIdleCallback(callback)
    : setTimeout(callback, 0);

const runTask = (task?: InteractionTask) => {
  if (typeof task === "function") return task();
  if (task && typeof task.gen === "function") return task.gen();
  return undefined;
};

const runAfterInteractions = (task?: InteractionTask): InteractionPromise => {
  let cancelled = false;
  const promise = new Promise<unknown>((resolve, reject) => {
    scheduleIdle(() => {
      if (cancelled) return;
      try {
        resolve(runTask(task));
      } catch (error) {
        reject(error);
      }
    });
  });
  return {
    then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
    done: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
    cancel: () => {
      cancelled = true;
    },
  };
};

export const InteractionManager = {
  Events: { interactionStart: "interactionStart", interactionComplete: "interactionComplete" },
  runAfterInteractions,
  createInteractionHandle: () => 0,
  clearInteractionHandle: (_handle: number) => {},
  addListener: (_eventType: string, _listener: (...args: unknown[]) => unknown) => ({
    remove: () => {},
  }),
  setDeadline: (_deadline: number) => {},
};

// require, not import: Babel copies `import *` namespaces, the patch must reach the real exports object
const reactNativeExports: Record<string, unknown> = require("react-native");

const hasInteractionManager = (() => {
  try {
    return reactNativeExports.InteractionManager != null;
  } catch {
    return false;
  }
})();

if (!hasInteractionManager) {
  Object.defineProperty(reactNativeExports, "InteractionManager", {
    configurable: true,
    enumerable: true,
    get: () => InteractionManager,
  });
}
