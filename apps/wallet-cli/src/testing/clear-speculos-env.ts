// Device tests pick their transport from SPECULOS_*, so values exported by the shell must not leak in.
const SPECULOS_ENV = [
  "SPECULOS_API_PORT",
  "SPECULOS_ADDRESS",
  "SPECULOS_DEVICE",
  "SPECULOS_SESSION_TOKEN",
];

for (const key of SPECULOS_ENV) {
  delete process.env[key];
}
