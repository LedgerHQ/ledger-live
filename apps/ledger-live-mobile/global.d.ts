/**
 * Allow custom properties on global (e2e setup, polyfills, HermesInternal, etc.)
 * without "Element implicitly has an 'any' type" when typechecking with strict global types.
 */
declare global {
  interface GlobalThis {
    [key: string]: any;
  }
}
export {};
