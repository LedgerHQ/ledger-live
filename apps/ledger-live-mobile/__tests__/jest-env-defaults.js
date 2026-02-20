/**
 * Set ENV defaults before any other setup or app code runs.
 * Avoids "Invalid ENV value for DEVICE_PROXY_URL" / "MOCK" etc. when @ledgerhq/live-env is read.
 */
if (process.env.DEVICE_PROXY_URL === undefined) process.env.DEVICE_PROXY_URL = "";
if (process.env.MOCK === undefined) process.env.MOCK = "";
