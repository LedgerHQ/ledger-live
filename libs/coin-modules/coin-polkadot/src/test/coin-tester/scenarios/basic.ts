import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Transaction as PolkadotTransaction } from "../../../types/bridge";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import resolver from "../../../signer";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { createBridges } from "../../../bridge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount } from "../../fixtures";
import { killZombienet, spawnZombienet } from "../zombienet";
import { defaultNanoApp } from "../scenarios.test";
import BigNumber from "bignumber.js";

const polkadot = getCryptoCurrencyById("polkadot");

function getTransactions() {
  const send1DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 1 DOT",
    recipient: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
    amount: new BigNumber(1),
  };

  const send100DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 100 DOT",
    recipient: "5D4yQHKfqCQYThhHmTfN1JEDi47uyDJc1xg9eZfAG1R7FC7J",
    amount: new BigNumber(100),
  };

  return [send1DotTransaction, send100DotTransaction];
}

export const basicScenario: Scenario<PolkadotTransaction> = {
  name: "Polkadot Basic transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Polkadot/app_${defaultNanoApp.version}.elf`),
      spawnZombienet(),
    ]);

    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(new Polkadot(transport));
    const getAddress = resolver(signerContext);

    const { address } = await getAddress("", {
      path: "44'/354'/0'/0'/0'",
      currency: polkadot,
      derivationMode: "polkadotbip44",
    });

    const { accountBridge, currencyBridge } = createBridges(signerContext);

    const account = makeAccount(address, polkadot);
    console.log("bridges created");

    // 1998 port comes from coin-config.toml config
    const wsProvider = new WsProvider("ws://127.0.0.1:1998");
    const api = await ApiPromise.create({ provider: wsProvider });

    const { data: balance } = (await api.query.system.account(address)) as any;
    console.log({ balance: balance.toString(10) });

    return { accountBridge, currencyBridge, address, account, onSignerConfirmation };
  },
  getTransactions,
  teardown: async () => {
    // wsProvider.disconnect();
    await Promise.all([killSpeculos(), killZombienet()]);
  },
};
