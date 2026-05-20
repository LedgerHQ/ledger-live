import { jest as runtimeJest } from "@jest/globals";

declare global {
  // eslint-disable-next-line no-var -- merged with `namespace jest` from @types/jest; `var` is required for global augmentation
  var jest: typeof runtimeJest;

  function enableConsole(): void;

  function disableConsole(): void;
}

export {};
