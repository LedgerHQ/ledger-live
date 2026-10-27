import { ApiPromise, Keyring } from "@polkadot/api";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";

/**
 * One instance serves both scenarios: Asset Hub and the relay chain, with a rest-api and an Atlas for each, laid out as
 * production's is. The sandbox shortens the eras to about a minute (see docker/polkadot/README.md in coin-sandbox).
 */
export function startPolkadotSandbox(): Promise<Sandbox> {
  return startSandbox(
    { family: "polkadot", network: "polkadot" },
    {
      node: { provider: "parity", version: "1.25.0" },
      indexer: { provider: "atlas", version: "2.9.5" },
    },
  );
}

/** The URL the sandbox gave one of the instance's services: `node`, `relay`, `indexer`, `relayIndexer`, `restApi`... */
export function endpointOf(sandbox: Sandbox, name: string): string {
  const url = sandbox.endpoints[name];
  if (url === undefined) throw new Error(`the sandbox instance has no ${name} endpoint`);
  return url;
}

/** The node's RPC, for polkadot-js: the sandbox publishes it as http, it also answers on ws. */
export const toWs = (url: string): string => url.replace(/^http/, "ws");

/** The accounts of a development chain are funded by Alice, whose key is public. */
const alice = () => new Keyring({ type: "sr25519", ss58Format: 0 }).addFromUri("//Alice");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends `planck` from Alice and waits for the balance to arrive. The sandbox's airdrop funds Asset Hub; the relay chain's
 * scenario funds its account here.
 */
export async function fundFromAlice(
  api: ApiPromise,
  address: string,
  planck: bigint,
): Promise<void> {
  const free = async () =>
    BigInt(
      ((await api.query.system.account(address)).toJSON() as { data: { free: string | number } })
        .data.free,
    );
  const before = await free();
  const funder = alice();
  // `signAndSend` does not report the status on this node: submit and read the balance
  const signed = await api.tx.balances.transferAllowDeath(address, planck).signAsync(funder, {
    nonce: await api.rpc.system.accountNextIndex(funder.address),
  });
  await api.rpc.author.submitExtrinsic(signed);
  for (let attempt = 0; attempt < 60; attempt++) {
    if ((await free()) >= before + planck) return;
    await sleep(1000);
  }
  throw new Error(`${address} was not funded within a minute`);
}

const activeEra = async (api: ApiPromise): Promise<number> =>
  ((await api.query.staking.activeEra()).toJSON() as { index: number } | null)?.index ?? 0;

/** Waits until the active era is `era` or later. */
export async function waitForActiveEra(
  api: ApiPromise,
  era: number,
  timeoutMs = 5 * 60 * 1000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while ((await activeEra(api)) < era) {
    if (Date.now() > deadline) throw new Error(`era ${era} was not reached`);
    await sleep(2000);
  }
}

/**
 * A past era whose rewards nobody claimed, and the validators elected in it: what a claim and a nomination need. The
 * first eras are activated before any election finished and have none, so it waits for the fourth, and takes the latest
 * era that has validators.
 */
export async function claimableEra(
  api: ApiPromise,
): Promise<{ era: number; validators: string[] }> {
  await waitForActiveEra(api, 4);
  for (let era = (await activeEra(api)) - 1; era >= 0; era--) {
    const elected = await api.query.staking.erasStakersOverview.entries(era);
    if (elected.length > 0) return { era, validators: elected.map(([key]) => String(key.args[1])) };
  }
  throw new Error("No validators were elected in any past era");
}

/** Waits for the era in which the account's unbonded funds can be withdrawn. */
export async function waitForUnlock(api: ApiPromise, address: string): Promise<void> {
  const ledger = (await api.query.staking.ledger(address)).toJSON() as {
    unlocking: { era: number }[];
  } | null;
  const eras = ledger?.unlocking.map(chunk => chunk.era) ?? [];
  if (eras.length > 0) await waitForActiveEra(api, Math.max(...eras));
}

type Health = { details?: Record<string, { metricValue?: number }> };

/**
 * The height Atlas's operations step reached, or nothing yet: its container may not be listening, or answer something
 * else than JSON. The request and the read of its body stop at `deadline`: a stalled Atlas must not outlast the wait
 * that asked.
 */
async function heightOf(uri: string, deadline: number): Promise<number | undefined> {
  const signal = AbortSignal.timeout(Math.max(deadline - Date.now(), 1));
  try {
    const response = await fetch(`${uri}/_health`, { signal });
    const health = (await response.json()) as Health;
    return health.details?.["operationsv1_step:height"]?.metricValue;
  } catch (error) {
    if (signal.aborted) {
      throw new Error(`Atlas did not answer ${uri}/_health before the deadline`, { cause: error });
    }
    return undefined;
  }
}

/** The Atlas of a chain: `uri` is its endpoint in the sandbox instance (`.../blockchain/dot`). */
export function atlasOf(uri: string) {
  return {
    /**
     * Waits until Atlas has indexed `block`. It follows the node a moment later, so a sync that came first would read
     * an account that has not moved yet. Its health reports the height its operations step reached.
     */
    waitForBlock: async (block: number, timeoutMs = 60 * 1000): Promise<void> => {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const height = await heightOf(uri, deadline);
        if (height !== undefined && height >= block) return;
        if (Date.now() > deadline) throw new Error(`Atlas did not reach block ${block} in 60 s`);
        await sleep(250);
      }
    },
  };
}

/** The number of the block that holds the extrinsic `hash`, once the node has sealed it. */
export async function waitForInclusion(
  api: ApiPromise,
  hash: string,
  timeoutMs = 60 * 1000,
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let next = Math.max((await api.rpc.chain.getHeader()).number.toNumber() - 5, 0);
  for (;;) {
    const head = (await api.rpc.chain.getHeader()).number.toNumber();
    for (; next <= head; next++) {
      const { block } = await api.rpc.chain.getBlock(await api.rpc.chain.getBlockHash(next));
      if (block.extrinsics.some(extrinsic => extrinsic.hash.toHex() === hash.toLowerCase())) {
        return next;
      }
    }
    if (Date.now() > deadline) throw new Error(`${hash} is not in a block after 60 s`);
    await sleep(250);
  }
}
