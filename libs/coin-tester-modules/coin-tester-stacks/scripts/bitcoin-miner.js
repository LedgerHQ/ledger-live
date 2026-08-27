// Standalone script, run as its OWN OS process (see `src/devnet.ts`'s `startBitcoinMiningWorkaround`)
// -- deliberately plain JS with zero dependencies (no ts-jest/swc transpilation needed to run it),
// since the whole point is decoupling from the Jest process's event loop, not just its call stack.
//
// Works around a genuine upstream `clarinet` bug: its own periodic bitcoin-block miner
// (`chains_coordinator.rs`'s `handle_bitcoin_mining`) was observed, during verification, to
// silently stop calling `generatetoaddress` after mining exactly one block past genesis -- no
// error, no further log line, chain height frozen indefinitely. This script replaces it with an
// equivalent, independently-verified-reliable one, calling the same RPC bitcoind already exposes.
//
// Running this in-process (a `setInterval` inside the same Node process running Jest) was tried
// first and was itself unreliable: Jest's own CPU-bound work (signing, `--runInBand` test
// execution) delays or starves the event loop long enough to occasionally miss ticks for minutes,
// which is indistinguishable from the original bug from the test's point of view. A separate OS
// process has its own independent event loop and isn't affected by Jest's load.

const RPC_URL = "http://127.0.0.1:18443";
const RPC_AUTH = Buffer.from("devnet:devnet").toString("base64");
// A faster cadence (previously 3s) demands more from the whole pipeline (bitcoind -> stacks-node
// -> stacks-signer -> stacks-api/Postgres) per unit time than this machine could always sustain
// while running the full Jest process alongside it on the same machine -- confirmed via
// `docker stats`/`top` during a real failure: down to ~90MB free physical memory with heavy
// swap-compressor activity. docs.stacks.co/clarinet/local-blockchain-development's "High resource
// usage" guidance suggests `bitcoin_controller_block_time = 60_000`; that traded too much runtime
// for the reliability gain (~40min+ just to reach this package's contract-deployment batch), so
// 10s is a middle ground -- slower than the original 3s, well short of the full 60s suggestion.
const BLOCK_TIME_MS = 10_000;
// One of Clarinet's own deterministic devnet accounts (derived from `settings/Devnet.toml`'s fixed
// mnemonics) -- the destination doesn't need to match Clarinet's configured miner address, or even
// be one this wallet can sign for; `generatetoaddress` only needs a valid regtest destination for
// the coinbase reward, and Stacks' burnchain-sync logic reacts to a new Bitcoin block existing, not
// to who received it.
const MINER_ADDRESS = "n3GRiDLKWuKLCw1DZmV75W1mE35qmW2tQm";

let mining = false;

function mineOnce() {
  if (mining) {
    return;
  }
  mining = true;
  fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${RPC_AUTH}` },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: "coin-tester-stacks",
      method: "generatetoaddress",
      params: [1, MINER_ADDRESS],
    }),
  })
    .then(res => res.json())
    .then(body => {
      if (body.error) {
        console.error("coin-tester-stacks bitcoin-miner: RPC error", body.error);
      }
    })
    .catch(err => {
      console.error("coin-tester-stacks bitcoin-miner: request failed", err);
    })
    .finally(() => {
      mining = false;
    });
}

setInterval(mineOnce, BLOCK_TIME_MS);

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
