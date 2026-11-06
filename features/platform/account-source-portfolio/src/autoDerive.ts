import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioFamily } from "./family";
import { bech32 } from "./internals/bech32";

type XpubNetwork = {
  /** `m/<purpose>h/<coin type>h/<account>h` paths the service derives from. */
  readonly path: RegExp;
  /** Our xpub as the service takes it; undefined when it would reject it. */
  readonly xpubOf: (xpub: string) => string | undefined;
};

const BASE58_XPUB = /^[1-9A-HJ-NP-Za-km-z]{111}$/;
const bitcoinXpub = (xpub: string) => (BASE58_XPUB.test(xpub) ? xpub : undefined);

/** Our Cardano xpub is the hex of the public key and chain code; the service takes them as `acct_xvk`. */
const CARDANO_XPUB = /^[0-9a-fA-F]{128}$/;
const cardanoXpub = (xpub: string) =>
  CARDANO_XPUB.test(xpub) ? bech32("acct_xvk", hexToBytes(xpub.toLowerCase())) : undefined;

/** The service derives purposes 44 and 84 only: it refuses segwit (49) and taproot (86) accounts. */
const XPUB_NETWORKS: ReadonlyMap<string, XpubNetwork> = new Map([
  ["bitcoin", { path: /^m\/(?:44|84)h\/0h\/\d+h$/, xpubOf: bitcoinXpub }],
  ["bitcoin_testnet", { path: /^m\/(?:44|84)h\/1h\/\d+h$/, xpubOf: bitcoinXpub }],
  ["cardano", { path: /^m\/1852h\/1815h\/\d+h$/, xpubOf: cardanoXpub }],
]);

/** Both xpub spellings are ASCII; no `TextEncoder`, which some runtimes lack. */
const asciiBytes = (text: string) => Uint8Array.from(text, char => char.codePointAt(0) ?? 0);

/** The service wants the path of the first address, while a descriptor stops at the account. */
const FIRST_ADDRESS = "/0/0";

function autoDeriveOf(descriptor: AccountDescriptor) {
  if (descriptor.type !== "utxo") return undefined;
  const network = XPUB_NETWORKS.get(descriptor.network);
  if (!network?.path.test(descriptor.path)) return undefined;
  const xpub = network.xpubOf(descriptor.xpub);
  return xpub === undefined ? undefined : { xpub, derivationPath: descriptor.path + FIRST_ADDRESS };
}

/** One `auto_derive` registration per xpub; the service names the account after the SHA-256 of the xpub it was sent. */
export const autoDeriveFamily: PortfolioFamily = {
  accountOf(descriptor) {
    const derived = autoDeriveOf(descriptor);
    if (!derived) return undefined;
    return {
      registration: { type: "auto_derive", network: descriptor.network, ...derived },
      serverAccountId: bytesToHex(sha256(asciiBytes(derived.xpub))),
    };
  },
  keyOf: ({ type, network, xpub }) =>
    type === "auto_derive" && network && xpub && XPUB_NETWORKS.has(network)
      ? `auto_derive:${network}:${xpub}`
      : undefined,
};
