import { Scenario } from "@ledgerhq/coin-tester/main";
import { Transaction as PolkadotTransaction } from "../../../types/bridge";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import resolver from "../../../signer/getAddress";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { createBridges } from "../../../bridge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount } from "../../fixtures";
import { killZombienet, spawnZombienet } from "../zombienet";
import { defaultNanoApp } from "../scenarios.test";

const polkadot = getCryptoCurrencyById("polkadot");

export const basicScenario: Scenario<PolkadotTransaction> = {
  name: "Polkadot Basic transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Polkadot/app_${defaultNanoApp.version}.elf`),
      spawnZombienet(),
    ]);

    // port comes is defined as `ws_port` in coin-tester.toml
    const wsProvider = new WsProvider("ws://127.0.0.1:1998");

    const api = await ApiPromise.create({ provider: wsProvider });

    const signerContext: Parameters<typeof resolver>[0] = (deviceId, fn) =>
      fn(new Polkadot(transport));
    const { accountBridge, currencyBridge } = createBridges(signerContext);
    const getAddress = resolver(signerContext);
    console.log("getAddress created");
    const { address } = await getAddress("", {
      path: "44'/354'/0'/0/0",
      currency: polkadot,
      derivationMode: "",
    });
    console.log("address created");

    const account = makeAccount(address, polkadot);
    console.log("bridges created");

    return { accountBridge, currencyBridge, address, account, onSignerConfirmation };
  },
  getTransactions: () => [],
  teardown: async () => {
    await Promise.all([killSpeculos(), killZombienet()]);
  },
};
