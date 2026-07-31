export {};

declare global {
  // Injected into the global scope by Danger's runner at runtime.
  const danger: any;
  function warn(message: string, file?: string, line?: number): void;
  function fail(message: string, file?: string, line?: number): void;
  function message(message: string, file?: string, line?: number): void;
  function markdown(message: string, file?: string, line?: number): void;
  function schedule(fn: unknown): void;
}
