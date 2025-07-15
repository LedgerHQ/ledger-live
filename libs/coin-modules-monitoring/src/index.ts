import { client, v2 } from "@datadog/datadog-api-client";

const apiV2 = new v2.LogsApi(
  client.createConfiguration({
    authMethods: {
      apiKeyAuth: process.env.DD_API_KEY,
      appKeyAuth: process.env.DD_APP_KEY,
    },
  }),
);

export interface MonitorParam {
  duration: number;
  currencyName: string;
  coinModuleName: string;
  operationType: "scan" | "sync";
  accountType: "pristine" | "average" | "big";
  transactions: number;
  accountAddress: string;
}

export async function monitor(params: MonitorParam[]) {
  return apiV2.submitLog({
    body: params.map(param => ({
      ddtags: "env:prd",
      message: JSON.stringify(param),
      service: "coin-modules-monitoring",
    })),
  });
}
