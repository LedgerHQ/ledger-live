import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import { ALEO_LOCAL_NODE } from "../constants";
import {
  broadcastTransaction,
  getProgramSource,
  getPublicBalance,
  waitForPublicBalance,
} from "../devnode";
import { GENESIS_ACCOUNT, generateAleoAccount, type GeneratedAleoAccount } from "../fixtures";
import { loadAleoWasm } from "../wasm";

// Fee master stand-in: the devnode builder makes the signer pay its own fee, so the sponsor refunds it first.

const SPONSOR_FUNDING_MICROCREDITS = 100_000_000;

let sponsor: GeneratedAleoAccount | undefined;
const sponsorTransactionIds = new Set<string>();
const sponsoredFeeByTransactionId = new Map<string, number>();

async function transferPublic(
  senderPrivateKey: string,
  recipient: string,
  amount: number,
): Promise<string> {
  const wasm = await loadAleoWasm();
  const transaction = await wasm.ProgramManagerBase.buildDevnodeExecutionTransaction(
    wasm.PrivateKey.from_string(senderPrivateKey),
    await getProgramSource(PROGRAM_ID.CREDITS),
    "transfer_public",
    [recipient, `${amount}u64`],
    0,
    undefined,
    ALEO_LOCAL_NODE,
  );
  await broadcastTransaction(transaction.toString());
  return transaction.id();
}

/** Call on a fresh stack: the previous sponsor and its transactions died with the old chain. */
export function resetSponsor(): void {
  sponsor = undefined;
  sponsorTransactionIds.clear();
  sponsoredFeeByTransactionId.clear();
}

export async function ensureSponsor(): Promise<GeneratedAleoAccount> {
  if (sponsor) return sponsor;

  const account = await generateAleoAccount();
  await transferPublic(GENESIS_ACCOUNT.privateKey, account.address, SPONSOR_FUNDING_MICROCREDITS);
  await waitForPublicBalance(account.address, BigInt(SPONSOR_FUNDING_MICROCREDITS));
  sponsor = account;
  return account;
}

export async function reimburseFee(payer: string, fee: number): Promise<void> {
  const account = await ensureSponsor();
  const before = await getPublicBalance(payer);
  sponsorTransactionIds.add(await transferPublic(account.privateKey, payer, fee));
  await waitForPublicBalance(payer, before + BigInt(fee));
}

export function recordSponsoredFee(transactionId: string, fee: number): void {
  sponsoredFeeByTransactionId.set(transactionId, fee);
}

export function isSponsorTransaction(transactionId: string): boolean {
  return sponsorTransactionIds.has(transactionId);
}

export function getSponsoredFee(transactionId: string): number | undefined {
  return sponsoredFeeByTransactionId.get(transactionId);
}
