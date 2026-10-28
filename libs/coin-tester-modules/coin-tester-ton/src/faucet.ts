import type { TonTransaction } from "@ledgerhq/coin-ton/network/types";
import { Address, SendMode, beginCell, external, internal, storeMessage } from "@ton/core";
import { keyPairFromSeed } from "@ton/crypto";
import { WalletContractV3R2 } from "@ton/ton";
import { latestTransactions } from "./indexer";
import { type WalletInformation, v2Get, v2Post } from "./tonHttpApi";

// MyLocalTon's masterchain faucet, created at genesis with 1M TON: a v3r2 wallet of id 42. The
// basechain faucet its README also lists does not exist in v4.3.0.
const FAUCET_SEED = "a51e8fb6f0fae3834bf430f5012589d319e7b3b3303ceb82c816b762fccf2d05";
const FAUCET_WALLET_ID = 42;
const POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 1_000;

/**
 * Sends `amount` to `recipient`, non-bounceable as it may not be deployed, and waits until the
 * indexer lists the transfer: it trails the node by a few blocks.
 */
export async function fund(recipient: Address, amount: bigint): Promise<void> {
  const keys = keyPairFromSeed(Buffer.from(FAUCET_SEED, "hex"));
  const faucet = WalletContractV3R2.create({
    workchain: -1,
    publicKey: keys.publicKey,
    walletId: FAUCET_WALLET_ID,
  });
  const { seqno } = await v2Get<WalletInformation>("getWalletInformation", {
    address: faucet.address.toRawString(),
  });

  const body = faucet.createTransfer({
    seqno: seqno ?? 0,
    secretKey: keys.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [internal({ to: recipient, value: amount, bounce: false })],
  });
  const message = beginCell()
    .store(storeMessage(external({ to: faucet.address, body })))
    .endCell();
  await v2Post("sendBoc", { boc: message.toBoc().toString("base64") });

  const isTheTransfer = ({ in_msg }: TonTransaction) =>
    !!in_msg?.source &&
    Address.parse(in_msg.source).equals(faucet.address) &&
    in_msg.value === amount.toString();

  let lastError: unknown;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    try {
      if ((await latestTransactions(recipient)).some(isTheTransfer)) return;
      lastError = undefined;
    } catch (error) {
      // `--wait` cannot tell when the indexer API answers: it has no healthcheck.
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`The faucet transfer to ${recipient.toRawString()} was not indexed`, {
    cause: lastError,
  });
}
