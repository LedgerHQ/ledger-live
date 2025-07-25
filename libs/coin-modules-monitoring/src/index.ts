import { client, v2 } from "@datadog/datadog-api-client";
import type { AccountShapeInfo, GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, DerivationMode } from "@ledgerhq/types-live";

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
  accountType: "pristine" | "average" | "big";
  transactions: number;
  accountAddressOrXpub: string;
}

export interface AccountInfo<A extends Account> {
  address: string;
  derivationMode?: DerivationMode;
  initialAccount?: Partial<A>;
  rest?: unknown;
}

export async function monitor<A extends Account>(
  currency: CryptoCurrency,
  accounts: {
    pristine?: AccountInfo<A>;
    average?: AccountInfo<A>;
    big?: AccountInfo<A>;
  },
  getAccountShape: GetAccountShape<A>,
) {
  const entries: LogEntry[] = [];

  for (const [accountType, accountAddress] of Object.entries(accounts)) {
    const info = {
      currency,
      index: 0,
      derivationPath: "",
      derivationMode: "",
      ...accountAddress,
    } as AccountShapeInfo<A>;
    const pagination = { paginationConfig: {} };

    const startScan = Date.now();
    const initialAccount = (await getAccountShape(info, pagination)) as A;
    const endScan = Date.now();

    const startSync = Date.now();
    await getAccountShape({ ...info, initialAccount }, pagination);
    const endSync = Date.now();

    entries.push(
      {
        duration: endScan - startScan,
        currencyName: currency.id,
        coinModuleName: currency.family,
        operationType: "scan",
        accountType: accountType as LogEntry["accountType"],
        transactions: initialAccount.operationsCount,
        accountAddressOrXpub: initialAccount.xpub || accountAddress.address,
      },
      {
        duration: endSync - startSync,
        currencyName: currency.id,
        coinModuleName: currency.family,
        operationType: "sync",
        accountType: accountType as LogEntry["accountType"],
        transactions: initialAccount.operationsCount,
        accountAddressOrXpub: initialAccount.xpub || accountAddress.address,
      },
    );
  }

  await apiV2.submitLog({
    body: entries.map(entries => ({
      ddtags: "env:prd",
      message: JSON.stringify(entries),
      service: "coin-modules-monitoring",
    })),
  });

  return entries;
}
