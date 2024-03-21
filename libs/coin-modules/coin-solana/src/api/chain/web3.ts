import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  ConfirmedSignatureInfo,
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
  StakeProgram,
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import chunk from "lodash/chunk";
import uniqBy from "lodash/uniqBy";
import { ChainAPI } from ".";
import { Awaited } from "../../logic";
import {
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeSplitCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenCreateATACommand,
  TokenTransferCommand,
  TransferCommand,
} from "../../types";
import { drainSeqAsyncGen, median } from "../../utils";
import { parseTokenAccountInfo, tryParseAsTokenAccount, tryParseAsVoteAccount } from "./account";
import { parseStakeAccountInfo } from "./account/parser";
import { StakeAccountInfo } from "./account/stake";
import { TokenAccountInfo } from "./account/token";
import { VoteAccountInfo } from "./account/vote";

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

type ParsedOnChainTokenAccount = Awaited<
  ReturnType<Connection["getParsedTokenAccountsByOwner"]>
>["value"][number];

type ParsedOnChainStakeAccount = Awaited<
  ReturnType<Connection["getParsedProgramAccounts"]>
>[number];

export type ParsedOnChainTokenAccountWithInfo = {
  onChainAcc: ParsedOnChainTokenAccount;
  info: TokenAccountInfo;
};

export type ParsedOnChainStakeAccountWithInfo = {
  onChainAcc: ParsedOnChainStakeAccount;
  info: StakeAccountInfo;
};

export function toTokenAccountWithInfo(
  onChainAcc: ParsedOnChainTokenAccount,
): ParsedOnChainTokenAccountWithInfo {
  const parsedInfo = onChainAcc.account.data.parsed.info;
  const info = parseTokenAccountInfo(parsedInfo);
  return { onChainAcc, info };
}

export function toStakeAccountWithInfo(
  onChainAcc: ParsedOnChainStakeAccount,
): ParsedOnChainStakeAccountWithInfo | undefined {
  if ("parsed" in onChainAcc.account.data) {
    const parsedInfo = onChainAcc.account.data.parsed.info;
    const info = parseStakeAccountInfo(parsedInfo);
    return { onChainAcc, info };
  }
  return undefined;
}

export type TransactionDescriptor = {
  parsed: ParsedTransactionWithMeta;
  info: ConfirmedSignatureInfo;
};

async function* getTransactionsBatched(
  address: string,
  untilTxSignature: string | undefined,
  api: ChainAPI,
): AsyncGenerator<TransactionDescriptor[], void, unknown> {
  // as per Ledger team - last 100 operations is a sane limit to begin with
  const signatures = await api.getSignaturesForAddress(address, {
    ...(untilTxSignature ? { until: untilTxSignature } : {}),
    limit: 100,
  });

  // max req payload is 50K, around 200 transactions atm
  // requesting 100 at a time to give some space for payload to change in future
  const batchSize = 100;

  for (const signaturesInfoBatch of chunk(signatures, batchSize)) {
    const transactions = await api.getParsedTransactions(
      signaturesInfoBatch.map(tx => tx.signature),
    );
    const txsDetails = transactions.reduce((acc, tx, index) => {
      if (tx && !tx.meta?.err && tx.blockTime) {
        acc.push({
          info: signaturesInfoBatch[index],
          parsed: tx,
        });
      }
      return acc;
    }, [] as TransactionDescriptor[]);

    yield txsDetails;
  }
}

async function* getTransactionsGen(
  address: string,
  untilTxSignature: string | undefined,
  api: ChainAPI,
): AsyncGenerator<TransactionDescriptor, void, undefined> {
  for await (const txDetailsBatch of getTransactionsBatched(address, untilTxSignature, api)) {
    yield* txDetailsBatch;
  }
}

export function getTransactions(
  address: string,
  untilTxSignature: string | undefined,
  api: ChainAPI,
): Promise<TransactionDescriptor[]> {
  return drainSeqAsyncGen(getTransactionsGen(address, untilTxSignature, api));
}

export const buildTransferInstructions = async (
  api: ChainAPI,
  { sender, recipient, amount, memo }: TransferCommand,
): Promise<TransactionInstruction[]> => {
  const fromPublicKey = new PublicKey(sender);
  const toPublicKey = new PublicKey(recipient);

  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports: amount,
    }),
  ];

  if (memo) {
    const memoIx = new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from(memo),
    });
    instructions.push(memoIx);
  }

  return appendMaybePriorityFeeInstruction(api, [fromPublicKey, toPublicKey], instructions);
};

export const buildTokenTransferInstructions = async (
  api: ChainAPI,
  command: TokenTransferCommand,
): Promise<TransactionInstruction[]> => {
  const {
    ownerAddress,
    ownerAssociatedTokenAccountAddress,
    amount,
    recipientDescriptor,
    mintAddress,
    mintDecimals,
    memo,
  } = command;
  const ownerPubkey = new PublicKey(ownerAddress);

  const destinationPubkey = new PublicKey(recipientDescriptor.tokenAccAddress);

  const instructions: TransactionInstruction[] = [];

  const mintPubkey = new PublicKey(mintAddress);

  if (recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        ownerPubkey,
        destinationPubkey,
        ownerPubkey,
        mintPubkey,
      ),
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      new PublicKey(ownerAssociatedTokenAccountAddress),
      mintPubkey,
      destinationPubkey,
      ownerPubkey,
      amount,
      mintDecimals,
    ),
  );

  if (memo) {
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(memo),
      }),
    );
  }

  return instructions;
};

export async function findAssociatedTokenAccountPubkey(
  ownerAddress: string,
  mintAddress: string,
): Promise<PublicKey> {
  const ownerPubKey = new PublicKey(ownerAddress);
  const mintPubkey = new PublicKey(mintAddress);

  return getAssociatedTokenAddress(mintPubkey, ownerPubKey);
}

export const getMaybeTokenAccount = async (
  address: string,
  api: ChainAPI,
): Promise<TokenAccountInfo | undefined | Error> => {
  const accInfo = await api.getAccountInfo(address);

  const tokenAccount =
    accInfo !== null && "parsed" in accInfo.data ? tryParseAsTokenAccount(accInfo.data) : undefined;

  return tokenAccount;
};

export async function getMaybeVoteAccount(
  address: string,
  api: ChainAPI,
): Promise<VoteAccountInfo | undefined | Error> {
  const accInfo = await api.getAccountInfo(address);
  const voteAccount =
    accInfo !== null && "parsed" in accInfo.data ? tryParseAsVoteAccount(accInfo.data) : undefined;

  return voteAccount;
}

export function getStakeAccountMinimumBalanceForRentExemption(api: ChainAPI) {
  return api.getMinimumBalanceForRentExemption(StakeProgram.space);
}

export async function getAccountMinimumBalanceForRentExemption(api: ChainAPI, address: string) {
  const accInfo = await api.getAccountInfo(address);
  const accSpace = accInfo !== null && "parsed" in accInfo.data ? accInfo.data.space : 0;

  return api.getMinimumBalanceForRentExemption(accSpace);
}

export async function getStakeAccountAddressWithSeed({
  fromAddress,
  seed,
}: {
  fromAddress: string;
  seed: string;
}) {
  const pubkey = await PublicKey.createWithSeed(
    new PublicKey(fromAddress),
    seed,
    StakeProgram.programId,
  );

  return pubkey.toBase58();
}

export async function getPriorityFee(api: ChainAPI, accounts: PublicKey[]): Promise<number> {
  const uniqAccs = uniqBy(accounts, acc => acc.toBase58());
  const recentFees = await api.getRecentPrioritizationFees({
    lockedWritableAccounts: uniqAccs,
  });

  return median(recentFees.map(item => item.prioritizationFee));
}

export async function buildMaybePriorityFeeInstruction(
  api: ChainAPI,
  accounts: PublicKey[],
): Promise<TransactionInstruction | null> {
  const priorityFee = await getPriorityFee(api, accounts);
  if (priorityFee === 0) return null;

  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee,
  });
}

export async function appendMaybePriorityFeeInstruction(
  api: ChainAPI,
  accounts: PublicKey[],
  ixs: TransactionInstruction[],
): Promise<TransactionInstruction[]> {
  const priorityFeeIx = await buildMaybePriorityFeeInstruction(api, accounts);
  return priorityFeeIx ? [priorityFeeIx, ...ixs] : ixs;
}

export function buildCreateAssociatedTokenAccountInstruction({
  mint,
  owner,
  associatedTokenAccountAddress,
}: TokenCreateATACommand): TransactionInstruction[] {
  const ownerPubKey = new PublicKey(owner);
  const mintPubkey = new PublicKey(mint);
  const associatedTokenAccPubkey = new PublicKey(associatedTokenAccountAddress);

  const instructions: TransactionInstruction[] = [
    createAssociatedTokenAccountInstruction(
      ownerPubKey,
      associatedTokenAccPubkey,
      ownerPubKey,
      mintPubkey,
    ),
  ];

  return instructions;
}

export async function buildStakeDelegateInstructions(
  api: ChainAPI,
  { authorizedAccAddr, stakeAccAddr, voteAccAddr }: StakeDelegateCommand,
): Promise<TransactionInstruction[]> {
  const withdrawAuthority = new PublicKey(authorizedAccAddr);
  const stakeAcc = new PublicKey(stakeAccAddr);
  const voteAcc = new PublicKey(voteAccAddr);
  const tx = StakeProgram.delegate({
    authorizedPubkey: withdrawAuthority,
    stakePubkey: stakeAcc,
    votePubkey: voteAcc,
  });

  return appendMaybePriorityFeeInstruction(api, [withdrawAuthority, stakeAcc], tx.instructions);
}

export async function buildStakeUndelegateInstructions(
  api: ChainAPI,
  { authorizedAccAddr, stakeAccAddr }: StakeUndelegateCommand,
): Promise<TransactionInstruction[]> {
  const withdrawAuthority = new PublicKey(authorizedAccAddr);
  const stakeAcc = new PublicKey(stakeAccAddr);
  const tx = StakeProgram.deactivate({
    authorizedPubkey: withdrawAuthority,
    stakePubkey: stakeAcc,
  });

  return appendMaybePriorityFeeInstruction(api, [withdrawAuthority, stakeAcc], tx.instructions);
}

export async function buildStakeWithdrawInstructions(
  api: ChainAPI,
  { authorizedAccAddr, stakeAccAddr, amount, toAccAddr }: StakeWithdrawCommand,
): Promise<TransactionInstruction[]> {
  const withdrawAuthority = new PublicKey(authorizedAccAddr);
  const stakeAcc = new PublicKey(stakeAccAddr);
  const recipient = new PublicKey(toAccAddr);
  const tx = StakeProgram.withdraw({
    authorizedPubkey: withdrawAuthority,
    stakePubkey: stakeAcc,
    lamports: amount,
    toPubkey: recipient,
  });

  return appendMaybePriorityFeeInstruction(api, [withdrawAuthority, stakeAcc], tx.instructions);
}

export async function buildStakeSplitInstructions(
  api: ChainAPI,
  { authorizedAccAddr, stakeAccAddr, seed, amount, splitStakeAccAddr }: StakeSplitCommand,
): Promise<TransactionInstruction[]> {
  const basePk = new PublicKey(authorizedAccAddr);
  const stakePk = new PublicKey(stakeAccAddr);
  const splitStakePk = new PublicKey(splitStakeAccAddr);
  const splitIx = StakeProgram.splitWithSeed({
    authorizedPubkey: basePk,
    lamports: amount,
    stakePubkey: stakePk,
    splitStakePubkey: splitStakePk,
    basePubkey: basePk,
    seed,
  });
  return appendMaybePriorityFeeInstruction(api, [basePk, stakePk], splitIx.instructions);
}

export async function buildStakeCreateAccountInstructions(
  api: ChainAPI,
  {
    fromAccAddress,
    stakeAccAddress,
    seed,
    amount,
    stakeAccRentExemptAmount,
    delegate,
  }: StakeCreateAccountCommand,
): Promise<TransactionInstruction[]> {
  const fromPubkey = new PublicKey(fromAccAddress);
  const stakePubkey = new PublicKey(stakeAccAddress);

  const tx = StakeProgram.createAccountWithSeed({
    fromPubkey,
    stakePubkey,
    basePubkey: fromPubkey,
    seed,
    lamports: amount + stakeAccRentExemptAmount,
    authorized: {
      staker: fromPubkey,
      withdrawer: fromPubkey,
    },
  });

  tx.add(
    StakeProgram.delegate({
      authorizedPubkey: fromPubkey,
      stakePubkey,
      votePubkey: new PublicKey(delegate.voteAccAddress),
    }),
  );
  return appendMaybePriorityFeeInstruction(api, [fromPubkey, stakePubkey], tx.instructions);
}
