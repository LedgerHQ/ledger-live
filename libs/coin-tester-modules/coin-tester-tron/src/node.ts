import chalk from "chalk";
import * as compose from "docker-compose";
import { TronWeb } from "tronweb";
import { TRON_LOCAL_URL } from "./fixtures";

const composeOptions = {
  cwd: __dirname,
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

/**
 * Default deployer private key shipped with `trontools/quickstart`. This key
 * controls the witness account that holds the entire initial TRX supply and
 * is the one TronBox uses for contract deployment in the upstream README.
 *
 * Source: https://github.com/TRON-US/docker-tron-quickstart#readme
 * ("TronBox 2.1+ configuration" — `privateKey` field).
 */
export const WITNESS_PRIVATE_KEY_HEX =
  "da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0";

/** Single TronWeb client bound to the local node and signed-in as the witness. */
export function makeWitnessTronWeb(): TronWeb {
  const tronWeb = new TronWeb({
    fullHost: TRON_LOCAL_URL,
    privateKey: WITNESS_PRIVATE_KEY_HEX,
  });
  // `trontools/quickstart` ships an older java-tron HTTP API that lacks
  // `/wallet/getblock`. TronWeb 6.x's `getCurrentRefBlockParams` calls that
  // endpoint to fetch reference-block parameters needed by every transaction
  // builder. We monkey-patch it to use `/wallet/getnowblock` instead, which
  // returns the same shape `{ block_header, blockID }`.
  tronWeb.trx.getCurrentRefBlockParams = async () => {
    const block = await tronWeb.fullNode.request<{
      block_header: { raw_data: { number: number; timestamp: number } };
      blockID: string;
    }>("wallet/getnowblock", undefined, "post");
    const { number, timestamp } = block.block_header.raw_data;
    return {
      ref_block_bytes: number.toString(16).slice(-4).padStart(4, "0"),
      ref_block_hash: block.blockID.slice(16, 32),
      expiration: timestamp + 60 * 1000,
      timestamp,
    };
  };
  return tronWeb;
}

export async function spawnNode(): Promise<void> {
  console.log("Starting tron quickstart container...");
  await compose.upOne("tron", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });
  await waitForNodeReady();
  console.log(chalk.bgBlueBright(" -  TRON QUICKSTART READY ✅  - "));
}

async function waitForNodeReady(timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${TRON_LOCAL_URL}/wallet/getnowblock`);
      if (res.ok) {
        const block = await res.json();
        if (block?.block_header?.raw_data?.number !== undefined) return;
      }
    } catch {
      /* node not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    `tron quickstart: /wallet/getnowblock did not return a valid block after ${timeoutMs / 1000} s.`,
  );
}

/** Transfers TRX from the witness to `address`. Returns the broadcast txid. */
export async function fundAccount(address: string, amountSun: number): Promise<string> {
  const tronWeb = makeWitnessTronWeb();
  const unsigned = await tronWeb.transactionBuilder.sendTrx(
    address,
    amountSun,
    tronWeb.defaultAddress.base58 as string,
  );
  const signed = await tronWeb.trx.sign(unsigned);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  if (!result.result) {
    throw new Error(`fundAccount: broadcast failed ${JSON.stringify(result)}`);
  }
  await waitForTxConfirmation(result.txid ?? signed.txID);
  return result.txid ?? signed.txID;
}

/**
 * Polls the full node's `/wallet/gettransactioninfobyid` until the tx is
 * included and returns the receipt. Used in place of `tronWeb.trx.getTransactionInfo`
 * (which hits the solidity node and lags behind by the irreversibility window).
 */
export async function waitForTxConfirmation(
  txID: string,
  timeoutMs = 30_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${TRON_LOCAL_URL}/wallet/gettransactioninfobyid`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: txID }),
    });
    if (res.ok) {
      const info = (await res.json()) as Record<string, unknown>;
      if (info?.blockNumber !== undefined) return info;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`waitForTxConfirmation: ${txID} not confirmed after ${timeoutMs / 1000} s`);
}

export async function killNode(): Promise<void> {
  console.log("Stopping tron quickstart container...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map((e) =>
  process.on(e, async () => {
    await killNode();
  }),
);
