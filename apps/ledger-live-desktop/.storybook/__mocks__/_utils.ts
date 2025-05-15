export function apiProxy<T extends object>(name: string, mock: Record<string, unknown> = {}): T {
  return new Proxy({} as T, {
    get: (target, key) => {
      console.log(name, key, "accessed");
      if (key in mock) {
        return mock[key as string];
      }
      return () => {}; // TODO return a Mock instead
    },
  });
}
