import { client, v2 } from "@datadog/datadog-api-client";
import { AccountType } from "./currencies";
import { Dist } from "./measure";

const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY,
    appKeyAuth: process.env.DD_APP_KEY,
  },
});
configuration.setServerVariables({
  site: process.env.DD_DOMAIN ?? "datadoghq.eu",
});
const apiV2 = new v2.LogsApi(configuration);

export interface LogEntry {
  duration: number;
  currencyName: string;
  coinModuleName: string;
  operationType: "scan" | "sync";
  accountType: AccountType;
  transactions: number;
  accountAddressOrXpub: string;
  totalNetworkCalls: number;
  networkCallsByDomain: Record<string, number>;
  cpu: Dist;
  memory: Dist;
}

export async function submitLogs(entries: LogEntry[]) {
  if (!process.env.SUBMIT_LOGS) {
    return;
  }

  await apiV2.submitLog({
    body: entries.map(entry => ({
      ddtags: "env:prd",
      message: JSON.stringify(entry),
      service: "coin-modules-monitoring",
    })),
  });
}
