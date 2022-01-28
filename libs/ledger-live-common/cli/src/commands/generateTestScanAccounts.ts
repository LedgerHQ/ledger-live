import { listen } from "@ledgerhq/logs";
import { map, reduce } from "rxjs/operators";
import { accountFormatters } from "@ledgerhq/live-common/lib/account";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { Account } from "@ledgerhq/live-common/lib/types";
export default {
  description: "Generate a test for scan accounts (live-common dataset)",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(accountFormatters).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (
    opts: ScanCommonOpts & {
      format: string;
    }
  ) => {
    if (!opts.currency) throw new Error("-c currency is missing");
    const apdus: string[] = [];
    listen((log) => {
      if (log.type === "apdu" && log.message) {
        apdus.push(log.message);
      }
    });
    return scan(opts).pipe(
      reduce<Account, Account[]>((all, a) => all.concat(a), []),
      map<Account[], string>((accounts) => {
        if (accounts.length === 0) throw new Error("no accounts!");
        const { currency } = accounts[0];
        return `
import type { CurrenciesData } from "../../../types";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "${currency.id} seed 1",
      apdus: \`\n${apdus.map((a) => "      " + a).join("\n")}\n      \`,
    },
  ],
};

export default dataset;
`;
      })
    );
  },
};
