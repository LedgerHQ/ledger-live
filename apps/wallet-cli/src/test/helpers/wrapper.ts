import "./http-intercept";

// When WALLET_CLI_MOCK_DMK=1, install the mock DMK transport before the CLI starts.
if (process.env.WALLET_CLI_MOCK_DMK) {
  await import("./dmk-intercept");
}

await import("../../cli");
