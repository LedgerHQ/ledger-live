import chalk from "chalk";
import Client from "bitcoin-core";
import * as compose from "docker-compose";

const cwd = `${__dirname}/../..`;

export const BTC_RPC = {
  username: "user",
  password: "pass",
  host: "http://127.0.0.1:18443",
  version: "0.28.0",
};

export function createBtcClient(): Client {
  return new Client(BTC_RPC);
}

export async function spawnBtcRegtest(): Promise<void> {
  console.log("Starting regtest bitcoind...");
  await compose.upOne("bitcoind", {
    cwd,
    config: "docker-compose.btc.yml",
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });

  const client = createBtcClient();
  for (let i = 0; i < 60; i++) {
    try {
      await client.command("getblockchaininfo");
      console.log(chalk.bgBlueBright(" -  BTC REGTEST READY  - "));
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  throw new Error("bitcoind did not become ready in time");
}

export async function killBtcRegtest(): Promise<void> {
  console.log("Stopping regtest bitcoind...");
  await compose.down({
    cwd,
    config: "docker-compose.btc.yml",
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
}

export async function ensureWallet(client: Client, name = "sendperf"): Promise<void> {
  try {
    await client.command("createwallet", name);
  } catch (err) {
    const message = (err as Error).message ?? "";
    if (!message.includes("already exists")) {
      throw err;
    }
    try {
      await client.command("loadwallet", name);
    } catch (loadErr) {
      const loadMessage = (loadErr as Error).message ?? "";
      if (!loadMessage.includes("already loaded")) {
        throw loadErr;
      }
    }
  }
}

export async function fundWallet(client: Client, blocks = 101): Promise<void> {
  const address = await client.getNewAddress();
  await client.generateToAddress({ nblocks: blocks, address });
}

export async function broadcastRawExpectReject(
  client: Client,
  hex: string,
  expectReject: string,
  alternates: string[] = [],
): Promise<void> {
  try {
    await client.sendRawTransaction({ hexstring: hex });
    throw new Error(`expected rejection containing "${expectReject}" but tx was accepted`);
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    const needles = [expectReject, ...alternates].map(s => s.toLowerCase());
    if (!needles.some(needle => message.toLowerCase().includes(needle))) {
      throw new Error(`expected rejection containing "${expectReject}", got: ${message}`);
    }
  }
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM"].forEach(signal => {
  process.on(signal, () => {
    void killBtcRegtest();
  });
});
