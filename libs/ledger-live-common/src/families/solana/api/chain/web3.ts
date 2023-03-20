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
} from "@solana/web3.js";
import { chunk } from "lodash";
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
import { drainSeqAsyncGen } from "../../utils";
import {
  parseTokenAccountInfo,
  tryParseAsTokenAccount,
  tryParseAsVoteAccount,
} from "./account";
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
  onChainAcc: ParsedOnChainTokenAccount
): ParsedOnChainTokenAccountWithInfo {
  const parsedInfo = onChainAcc.account.data.parsed.info;
  const info = parseTokenAccountInfo(parsedInfo);
  return { onChainAcc, info };
}

export function toStakeAccountWithInfo(
  onChainAcc: ParsedOnChainStakeAccount
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
  api: ChainAPI
): AsyncGenerator<TransactionDescriptor[], void, unknown> {
  // as per Ledger team - last 100 operations is a sane limit to begin with
  const signatures = await api.getSignaturesForAddress(address, {
    until: untilTxSignature,
    limit: 100,
  });

  // max req payload is 50K, around 200 transactions atm
  // requesting 100 at a time to give some space for payload to change in future
  const batchSize = 100;

  for (const signaturesInfoBatch of chunk(signatures, batchSize)) {
    const transactions = await api.getParsedTransactions(
      signaturesInfoBatch.map((tx) => tx.signature)
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
  api: ChainAPI
): AsyncGenerator<TransactionDescriptor, void, undefined> {
  for await (const txDetailsBatch of getTransactionsBatched(
    address,
    untilTxSignature,
    api
  )) {
    yield* txDetailsBatch;
  }
}

export function getTransactions(
  address: string,
  untilTxSignature: string | undefined,
  api: ChainAPI
): Promise<TransactionDescriptor[]> {
  return drainSeqAsyncGen(getTransactionsGen(address, untilTxSignature, api));
}

export const buildTransferInstructions = ({
  sender,
  recipient,
  amount,
  memo,
}: TransferCommand): TransactionInstruction[] => {
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

  return instructions;
};

export const buildTokenTransferInstructions = (
  command: TokenTransferCommand
): TransactionInstruction[] => {
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
        mintPubkey
      )
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      new PublicKey(ownerAssociatedTokenAccountAddress),
      mintPubkey,
      destinationPubkey,
      ownerPubkey,
      amount,
      mintDecimals
    )
  );

  if (memo) {
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(memo),
      })
    );
  }

  return instructions;
};

export async function findAssociatedTokenAccountPubkey(
  ownerAddress: string,
  mintAddress: string
): Promise<PublicKey> {
  const ownerPubKey = new PublicKey(ownerAddress);
  const mintPubkey = new PublicKey(mintAddress);

  return getAssociatedTokenAddress(mintPubkey, ownerPubKey);
}

export const getMaybeTokenAccount = async (
  address: string,
  api: ChainAPI
): Promise<TokenAccountInfo | undefined | Error> => {
  const accInfo = await api.getAccountInfo(address);

  const tokenAccount =
    accInfo !== null && "parsed" in accInfo.data
      ? tryParseAsTokenAccount(accInfo.data)
      : undefined;

  return tokenAccount;
};

export async function getMaybeVoteAccount(
  address: string,
  api: ChainAPI
): Promise<VoteAccountInfo | undefined | Error> {
  const accInfo = await api.getAccountInfo(address);
  const voteAccount =
    accInfo !== null && "parsed" in accInfo.data
      ? tryParseAsVoteAccount(accInfo.data)
      : undefined;

  return voteAccount;
}

export function getStakeAccountMinimumBalanceForRentExemption(api: ChainAPI) {
  return api.getMinimumBalanceForRentExemption(StakeProgram.space);
}

export async function getAccountMinimumBalanceForRentExemption(
  api: ChainAPI,
  address: string
) {
  const accInfo = await api.getAccountInfo(address);
  const accSpace =
    accInfo !== null && "parsed" in accInfo.data ? accInfo.data.space : 0;

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
    StakeProgram.programId
  );

  return pubkey.toBase58();
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
      mintPubkey
    ),
  ];

  return instructions;
}

export function buildStakeDelegateInstructions({
  authorizedAccAddr,
  stakeAccAddr,
  voteAccAddr,
}: StakeDelegateCommand): TransactionInstruction[] {
  const tx = StakeProgram.delegate({
    authorizedPubkey: new PublicKey(authorizedAccAddr),
    stakePubkey: new PublicKey(stakeAccAddr),
    votePubkey: new PublicKey(voteAccAddr),
  });

  return tx.instructions;
}

export function buildStakeUndelegateInstructions({
  authorizedAccAddr,
  stakeAccAddr,
}: StakeUndelegateCommand): TransactionInstruction[] {
  const tx = StakeProgram.deactivate({
    authorizedPubkey: new PublicKey(authorizedAccAddr),
    stakePubkey: new PublicKey(stakeAccAddr),
  });

  return tx.instructions;
}

export function buildStakeWithdrawInstructions({
  authorizedAccAddr,
  stakeAccAddr,
  amount,
  toAccAddr,
}: StakeWithdrawCommand): TransactionInstruction[] {
  const tx = StakeProgram.withdraw({
    authorizedPubkey: new PublicKey(authorizedAccAddr),
    stakePubkey: new PublicKey(stakeAccAddr),
    lamports: amount,
    toPubkey: new PublicKey(toAccAddr),
  });

  return tx.instructions;
}

export function buildStakeSplitInstructions({
  authorizedAccAddr,
  stakeAccAddr,
  seed,
  amount,
  splitStakeAccAddr,
}: StakeSplitCommand): TransactionInstruction[] {
  // HACK: switch to split_with_seed when supported by @solana/web3.js
  const splitIx = StakeProgram.split({
    authorizedPubkey: new PublicKey(authorizedAccAddr),
    lamports: amount,
    stakePubkey: new PublicKey(stakeAccAddr),
    splitStakePubkey: new PublicKey(splitStakeAccAddr),
  }).instructions[1];

  if (splitIx === undefined) {
    throw new Error("expected split instruction");
  }

  const allocateIx = SystemProgram.allocate({
    accountPubkey: new PublicKey(splitStakeAccAddr),
    basePubkey: new PublicKey(authorizedAccAddr),
    programId: StakeProgram.programId,
    seed,
    space: StakeProgram.space,
  });

  return [allocateIx, splitIx];
}

export function buildStakeCreateAccountInstructions({
  fromAccAddress,
  stakeAccAddress,
  seed,
  amount,
  stakeAccRentExemptAmount,
  delegate,
}: StakeCreateAccountCommand): TransactionInstruction[] {
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
    })
  );

  return tx.instructions;
}
