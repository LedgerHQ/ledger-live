import "tsconfig-paths/register";

// Suppress Polkadot 'has multiple versions' warnings from all console methods and stdout/stderr
const methods: (keyof Console)[] = ["info", "warn", "error", "log"];
methods.forEach(method => {
  const original = console[method];
  (console[method] as (...args: any[]) => void) = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("@polkadot") &&
      args[0].includes("has multiple versions")
    ) {
      return; // Suppress the Polkadot warning
    }
    (original as (...args: any[]) => void)(...args);
  };
});

const suppressPolkadot = (chunk: any) =>
  typeof chunk === "string" &&
  chunk.includes("@polkadot") &&
  chunk.includes("has multiple versions");

const origStdoutWrite = process.stdout.write;
process.stdout.write = function (chunk: any, ...args: any[]) {
  if (suppressPolkadot(chunk)) return true;
  return origStdoutWrite.call(this, chunk, ...args);
};

const origStderrWrite = process.stderr.write;
process.stderr.write = function (chunk: any, ...args: any[]) {
  if (suppressPolkadot(chunk)) return true;
  return origStderrWrite.call(this, chunk, ...args);
};
