import "dotenv/config";
import util from "util";
import axios from "axios";
import chalk from "chalk";
import pick from "lodash/pick";
import omit from "lodash/omit";
import { ethers } from "ethers";
import { tap } from "rxjs/operators";
import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import makeGetAddress from "@ledgerhq/coin-evm/hw-getAddress";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { buildAccountBridge } from "@ledgerhq/coin-evm/bridge/js";
import { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { makeAccount } from "@ledgerhq/coin-evm/__tests__/fixtures/common.fixtures";
import { spawnDocker } from "./docker";
import { ENV, NanoApp } from "./types";
import { getLogs } from "./indexer";

const { API_PORT } = process.env as ENV;

export const executeScenario = async (scenario: Scenario) => {
  if (!API_PORT) throw new Error("incorrect env file");

  const transport = await spawnDocker({
    nanoApp: scenario.nanoApp,
    rpc: scenario.rpc,
  }).catch(e => {
    console.error(e);
    throw e;
  });

  const signerContext = (deviceId: string, fn: any) => fn(new Eth(transport));
  const getAddress = makeGetAddress(signerContext);
  const { address } = await getAddress("", {
    path: "44'/60'/0'/0/0",
    currency: scenario.currency,
    derivationMode: "",
  });

  await scenario.beforeTransactions?.(address);

  console.log("\n");
  console.log(chalk.bgBlue("     Address     "), " → ", chalk.bold.blue(address), "\n");

  const accountBridge = buildAccountBridge(signerContext);
  const baseAccount = makeAccount(address, scenario.currency);
  let account = await accountBridge
    .sync(baseAccount, { paginationConfig: {} })
    .toPromise()
    .then(updater => {
      if (!updater || !baseAccount) throw new Error("No updater or account");
      return updater(baseAccount);
    })
    .catch(e => {
      console.error("SYNC ERROR", e);
      throw e;
    });

  for (const testTransaction of scenario.transactions) {
    console.log("\n\n\n");
    console.log(
      chalk.bgGreen.black.bold(" ✧ "),
      "            ",
      chalk.green("TRANSACTION N°", chalk.bold(scenario.transactions.indexOf(testTransaction) + 1)),

      "            ",
      chalk.bgGreen.black.bold(" ✧ "),
    );

    const syncedAccount = await accountBridge
      .sync(account, { paginationConfig: {} })
      .toPromise()
      .then(updater => {
        if (!updater || !account) throw new Error("No updater or account");
        return updater(account);
      });

    console.log(chalk.black.bgCyan("\n- BEFORE STATE -\n"));
    console.log(
      chalk.cyan(
        "Account",
        util.inspect(
          pick(syncedAccount, [
            "balance",
            "freshAddress",
            "operationsCount",
            "operations",
            "pendingOperations",
          ]),
          { colors: true, depth: null },
        ),
      ),
    );

    console.log(
      chalk.cyan(
        `Account balance:`,
        `${ethers.utils.formatEther(syncedAccount.balance.toFixed())} ${
          syncedAccount.currency.ticker
        }`,
      ),
    );
    account.subAccounts?.forEach(tokenAccount => {
      if (tokenAccount.type !== "TokenAccount") return;
      console.log(
        chalk.cyan(
          "Token Account balance:",
          `${ethers.utils.formatUnits(
            tokenAccount.balance.toString(),
            tokenAccount.token.units[0].magnitude,
          )} ${tokenAccount.token.ticker}`,
        ),
      );
    });
    console.log(chalk.black.bgCyan("\n- / BEFORE STATE -\n"));

    if (!syncedAccount) throw new Error("No Synced Account");

    const defaultTransaction = accountBridge.createTransaction(syncedAccount);
    const transaction = await accountBridge.prepareTransaction(syncedAccount, {
      ...defaultTransaction,
      ...testTransaction,
    } as Transaction);

    const status = await accountBridge.getTransactionStatus(syncedAccount, transaction);
    console.log("Status:");
    console.table(
      Object.fromEntries(
        Object.entries(omit(status, ["errors", "warnings"])).map(([a, b]) => [
          a,
          BigNumber.isBigNumber(b) ? b.toFixed() : b.toString(),
        ]),
      ),
    );
    if (Object.values(status.errors).length) {
      console.log("Errors:");
      console.table(
        Object.fromEntries(Object.entries(status.errors).map(([a, b]) => [a, b.toString()])),
      );

      throw new Error("Transaction had errors");
    }
    if (Object.values(status.warnings).length) {
      console.log("Warnings:");
      console.table(
        Object.fromEntries(Object.entries(status.warnings).map(([a, b]) => [a, b.toString()])),
      );
    }

    const { signedOperation } = (await accountBridge
      .signOperation({
        account,
        transaction,
        deviceId: "",
      })
      .pipe(
        // @ts-expect-error rxjs wtf
        tap({
          next: async val => {
            const recursiveAutoSigner = async () => {
              if (val.type === "device-signature-requested") {
                const { data } = await axios.get(
                  `http://localhost:${API_PORT}/events?currentscreenonly=true`,
                );

                if (data.events[0].text !== "Accept") {
                  await axios.post(`http://localhost:${API_PORT}/button/right`, {
                    action: "press-and-release",
                  });
                  recursiveAutoSigner();
                } else {
                  await axios.post(`http://localhost:${API_PORT}/button/both`, {
                    action: "press-and-release",
                  });
                }
              }
            };
            await recursiveAutoSigner();
          },
          error: error => {
            console.log("Failed to sign", error.message);
          },
          complete: () => console.log(chalk.bgWhite.black("\n\n ✔️  Signed the transaction ✍️  ")),
        }),
      )
      .toPromise()) as SignOperationEvent & { type: "signed" };

    const optimisticOperation = await accountBridge
      .broadcast({ account, signedOperation })
      .catch(e => {
        console.debug("TRANSACTION FAILED BROADCASTING ❌");
        console.debug({ message: e.message });
        return null;
      });

    if (!optimisticOperation) continue;

    await getLogs();

    console.log({ optimisticOperation });

    console.log(chalk.bgGreenBright.black("\n 🛫  Broadcated the transaction 🛫  \n\n"));

    const updatedAccount: Account = await accountBridge
      .sync(
        { ...account, pendingOperations: [optimisticOperation] },
        {
          paginationConfig: {},
        },
      )
      .toPromise()
      .then(updater => {
        if (!updater || !account) throw new Error("No updater or account");
        return updater(account);
      });

    if (!updatedAccount) throw new Error("No Updated Account");

    console.log(chalk.black.bgMagenta("\n- AFTER STATE -\n"));
    console.log(
      chalk.magenta(
        "Updated Account",
        util.inspect(
          pick(updatedAccount, [
            "balance",
            "freshAddress",
            "operationsCount",
            "operations",
            "pendingOperations",
          ]),
          { colors: true, depth: null },
        ),
      ),
    );

    console.log(
      chalk.magenta(
        "Account balance:",
        `${ethers.utils.formatEther(updatedAccount.balance.toFixed())} ${
          updatedAccount.currency.ticker
        }`,
      ),
    );
    updatedAccount.subAccounts?.forEach(tokenAccount => {
      if (tokenAccount.type !== "TokenAccount") return;
      console.log(
        chalk.magenta(
          "Token Account balance:",
          `${ethers.utils.formatUnits(
            tokenAccount.balance.toString(),
            tokenAccount.token.units[0].magnitude,
          )} ${tokenAccount.token.ticker}`,
        ),
      );
    });
    console.log(chalk.black.bgMagenta("\n- / AFTER STATE -\n"));

    if (updatedAccount.operations.length !== account.operations.length + 1)
      throw new Error("Operation was not confirmed on chain");

    account = updatedAccount;
  }

  throw "done";
};

export type Scenario = {
  currency: CryptoCurrency;
  rpc: string;
  transactions: Partial<Transaction>[];
  nanoApp: NanoApp;
  beforeTransactions?: (address: string) => Promise<void>;
};
