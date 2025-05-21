import merge from "lodash/merge";

export function apiProxy<T extends object>(name: string, mock: Record<string, unknown> = {}): T {
  const target = {
    ...mock,
    __extends: (obj: Record<string, unknown>) => apiProxy(name, merge(target, obj)),
  };
  return new Proxy(target as T, {
    get: (target, key) => {
      console.log(name, key, "accessed");
      if (key in target) return target[key as string];
      return () => {}; // TODO return a Mock instead
    },
  });
}
