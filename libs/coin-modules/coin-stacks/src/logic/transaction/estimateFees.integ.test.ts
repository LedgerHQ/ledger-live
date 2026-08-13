import type {
  MemoNotSupported,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  getAddressFromPrivateKey,
  makeRandomPrivKey,
  privateKeyToPublic,
  publicKeyToHex,
} from "@stacks/transactions";
import type { StacksTxData } from "../../types";
import { estimateFees } from "./estimateFees";

// Real network round-trip, no device/funds needed: fee estimation is byte-length-based and the
// nonce lookup for a fresh, never-used address simply resolves to 0 -- both work against a real
// endpoint without a funded account.
const senderKey = makeRandomPrivKey();
const SENDER = getAddressFromPrivateKey(senderKey, "mainnet");
const SENDER_PUBLIC_KEY = publicKeyToHex(privateKeyToPublic(senderKey));
const RECIPIENT = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

// A real, live-verified SIP-010 contract (sBTC) and a real, currently-registered pox-5 signer --
// see integrations/stacks/implementation-plans/LIVE-33267-plan.md's "PoX-5 staking redesign".
const SBTC_ASSET_REFERENCE = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token";
const REAL_SIGNER_MANAGER = "SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.native-pool-signer-manager";

describe("estimateFees (Alpaca)", () => {
  it("estimates a real fee for a native STX transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, StacksTxData> = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000n,
      asset: { type: "native" },
      senderPublicKey: SENDER_PUBLIC_KEY,
      data: { type: "stacks-pox" },
    };

    const { value } = await estimateFees(intent);

    expect(value).toBeGreaterThan(0n);
  });

  it("estimates a real fee for a SIP-010 token transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, StacksTxData> = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000n,
      asset: { type: "token", assetReference: SBTC_ASSET_REFERENCE },
      senderPublicKey: SENDER_PUBLIC_KEY,
      data: { type: "stacks-pox" },
    };

    const { value } = await estimateFees(intent);

    expect(value).toBeGreaterThan(0n);
  });

  it("estimates a real fee for a pox-5 stake (delegate) intent", async () => {
    const intent: StakingTransactionIntent<MemoNotSupported, StacksTxData> = {
      intentType: "staking",
      type: "stake",
      mode: "delegate",
      sender: SENDER,
      recipient: SENDER,
      valAddress: REAL_SIGNER_MANAGER,
      amount: 1000000n,
      asset: { type: "native" },
      senderPublicKey: SENDER_PUBLIC_KEY,
      data: { type: "stacks-pox", numCycles: 6, startBurnHt: 1_000_000 },
    };

    const { value } = await estimateFees(intent);

    expect(value).toBeGreaterThan(0n);
  });
});
