import { Sandbox, DEFAULT_ACCOUNT_ID, DEFAULT_PRIVATE_KEY } from "near-sandbox";
import { Account, JsonRpcProvider, KeyPair, KeyPairSigner, type KeyPairString } from "near-api-js";
import { createServer } from "node:net";

export type SandboxHandle = {
  rpcUrl: string;
  provider: JsonRpcProvider;
  /** Registers `keyPair` as the account's signer when given, otherwise reuses the one it was created with. */
  account(accountId: string, keyPair?: KeyPair): Account;
  /** Genesis account holding the whole supply; every test account is funded from it. */
  root: Account;
  /** Pass a key pair when the signer has to hold the same key as the on-chain account. */
  createFundedAccount(accountId: string, yocto: bigint, keyPair?: KeyPair): Promise<Account>;
  /** Skip ahead in block height. The staking pool's unlock is counted in epochs, not wall clock. */
  fastForward(deltaHeight: number): Promise<void>;
  rpc<T = unknown>(method: string, params: unknown): Promise<T>;
  tearDown(): Promise<void>;
};

// Picked per run so the two strategies don't collide with each other or a leftover node.
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });
}

export async function startSandbox(): Promise<SandboxHandle> {
  // Genesis is left alone on purpose: shrinking `epoch_length` to speed the unstake lock up stops
  // the node from ever becoming ready. `fastForward` covers the same need without touching consensus.
  const sandbox = await Sandbox.start({
    config: { rpcPort: await freePort() },
  });
  const { rpcUrl } = sandbox;

  const rpc = async <T>(method: string, params: unknown): Promise<T> => {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "coin-tester",
        method,
        params,
      }),
    });
    const body = (await response.json()) as { result?: T; error?: unknown };

    if (body.error) {
      throw new Error(`near-sandbox ${method}: ${JSON.stringify(body.error)}`);
    }

    return body.result as T;
  };

  // A fresh account is visible optimistically before final, but the coin module queries with finality: "final".
  const waitUntilFinal = async (accountId: string): Promise<void> => {
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        await rpc("query", {
          request_type: "view_account",
          finality: "final",
          account_id: accountId,
        });
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    throw new Error(`coin-tester-near: ${accountId} never became final`);
  };

  const provider = new JsonRpcProvider({ url: rpcUrl });
  const keyPairs = new Map<string, KeyPair>();

  const account = (accountId: string, keyPair?: KeyPair): Account => {
    if (keyPair) {
      keyPairs.set(accountId, keyPair);
    }
    const key = keyPairs.get(accountId);
    return new Account(accountId, provider, key ? new KeyPairSigner(key) : undefined);
  };

  const root = account(
    DEFAULT_ACCOUNT_ID,
    KeyPair.fromString(DEFAULT_PRIVATE_KEY as KeyPairString),
  );

  return {
    rpcUrl,
    provider,
    account,
    root,
    rpc,
    async createFundedAccount(accountId, yocto, keyPair) {
      const key = keyPair ?? KeyPair.fromRandom("ed25519");
      const created = account(accountId, key);
      await root.createAccount({
        newAccountId: accountId,
        publicKey: key.getPublicKey(),
        nearToTransfer: yocto,
      });
      await waitUntilFinal(accountId);
      return created;
    },
    async fastForward(deltaHeight) {
      await rpc("sandbox_fast_forward", { delta_height: deltaHeight });
    },
    async tearDown() {
      // The node occasionally keeps a socket open and never resolves; the temp home is disposable,
      // so a stuck shutdown must not hold the whole suite hostage.
      let timer: NodeJS.Timeout | undefined;
      await Promise.race([
        sandbox.tearDown(),
        new Promise<void>(resolve => {
          timer = setTimeout(() => {
            console.warn("coin-tester-near: sandbox teardown timed out, continuing");
            resolve();
          }, 15_000);
        }),
      ]);
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
