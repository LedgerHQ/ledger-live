import { setEnv } from "@ledgerhq/live-env";

if (process.env.NODE_ENV === "production") {
  const value = `lld/${__APP_VERSION__}`;
  setEnv("LEDGER_CLIENT_VERSION", value);
}
