// Shell and `.env` values must not leak in: SPECULOS_* picks the transport, SWAP_API_BASE the API.
const SHELL_ENV = [
  "SPECULOS_API_PORT",
  "SPECULOS_ADDRESS",
  "SPECULOS_DEVICE",
  "SPECULOS_SESSION_TOKEN",
  "SWAP_API_BASE",
];

for (const key of SHELL_ENV) {
  delete process.env[key];
}
