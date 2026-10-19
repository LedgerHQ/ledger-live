import { AccountType } from "./currencies";
import { Dist } from "./measure";

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

  const site = process.env.DD_DOMAIN ?? "datadoghq.eu";
  const response = await fetch(`https://http-intake.logs.${site}/api/v2/logs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "DD-API-KEY": process.env.DD_API_KEY ?? "",
    },
    body: JSON.stringify(
      entries.map(entry => ({
        ddtags: "env:prd",
        message: JSON.stringify(entry),
        service: "coin-modules-monitoring",
      })),
    ),
  });
  if (!response.ok) {
    throw new Error(`Datadog logs submission failed: ${response.status} ${await response.text()}`);
  }
}
