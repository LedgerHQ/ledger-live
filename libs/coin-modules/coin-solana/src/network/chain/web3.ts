import {
  createAmountToUiAmountInstruction,
  createApproveCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  createRevokeInstruction,
  createTransferCheckedInstruction,
  createTransferCheckedWithFeeAndTransferHookInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
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
  AccountInfo,
  ParsedAccountData,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import chunk from "lodash/chunk";
import uniq from "lodash/uniq";
import { getTokenAccountProgramId } from "../../helpers/token";
import { Awaited } from "../../logic";
import {
  SolanaTokenProgram,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeSplitCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenCreateApproveCommand,
  TokenCreateATACommand,
  TokenCreateRevokeCommand,
  TokenTransferCommand,
  TransferCommand,
} from "../../types";
import { drainSeqAsyncGen, median } from "../../utils";
import {
  parseTokenAccountInfo,
  tryParseAsTokenAccount,
  tryParseAsVoteAccount,
  tryParseAsMintAccount,
} from "./account";
import { parseStakeAccountInfo } from "./account/parser";
import { StakeAccountInfo } from "./account/stake";
import { MintAccountInfo, TokenAccountInfo } from "./account/token";
import { VoteAccountInfo } from "./account/vote";
import { PARSED_PROGRAMS } from "./program/constants";
import { ChainAPI } from ".";

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

export type ParsedOnChainMintWithInfo = {
  onChainAcc: AccountInfo<ParsedAccountData>;
  info: MintAccountInfo;
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
    const sortedTransactions = transactions.sort((a, b) => (b?.slot ?? 0) - (a?.slot ?? 0));
    const txsDetails = sortedTransactions.reduce((acc, tx) => {
      if (tx && !tx.meta?.err && tx.blockTime) {
        const info = signaturesInfoBatch.find(s =>
          tx.transaction.signatures.includes(s.signature),
        )!;
        if (info) {
          acc.push({
            info,
            parsed: tx,
          });
        }
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

  return appendMaybePriorityFeeInstructions(api, instructions, fromPublicKey);
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
    tokenProgram,
    extensions,
  } = command;
  const ownerPubkey = new PublicKey(ownerAddress);

  const destinationPubkey = new PublicKey(recipientDescriptor.tokenAccAddress);

  const destinationOwnerPubkey = new PublicKey(recipientDescriptor.walletAddress);

  const instructions: TransactionInstruction[] = [];

  const mintPubkey = new PublicKey(mintAddress);

  const programId = getTokenAccountProgramId(tokenProgram);

  if (recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        ownerPubkey,
        destinationPubkey,
        destinationOwnerPubkey,
        mintPubkey,
        programId,
      ),
    );
  }

  const transferFeeCalculated = extensions?.transferFee;
  const transferIx =
    tokenProgram === PARSED_PROGRAMS.SPL_TOKEN_2022
      ? await createTransferCheckedWithFeeAndTransferHookInstruction(
          api.connection,
          new PublicKey(ownerAssociatedTokenAccountAddress),
          mintPubkey,
          destinationPubkey,
          ownerPubkey,
          BigInt(transferFeeCalculated?.transferAmountIncludingFee || amount),
          mintDecimals,
          BigInt(transferFeeCalculated?.transferFee ?? 0),
          undefined,
          "confirmed",
          programId,
        )
      : createTransferCheckedInstruction(
          new PublicKey(ownerAssociatedTokenAccountAddress),
          mintPubkey,
          destinationPubkey,
          ownerPubkey,
          amount,
          mintDecimals,
          undefined,
          programId,
        );

  instructions.push(transferIx);

  if (memo) {
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(memo),
      }),
    );
  }

  return appendMaybePriorityFeeInstructions(api, instructions, ownerPubkey);
};

export const buildApproveTransactionInstructions = async (
  api: ChainAPI,
  {
    account,
    mintAddress,
    recipientDescriptor,
    owner,
    amount,
    decimals,
    tokenProgram,
  }: TokenCreateApproveCommand,
): Promise<TransactionInstruction[]> => {
  const instructions: TransactionInstruction[] = [];

  const programId = getTokenAccountProgramId(tokenProgram);

  const accountPubKey = new PublicKey(account);
  const destinationOwnerPubkey = new PublicKey(recipientDescriptor.walletAddress);
  const ownerPubKey = new PublicKey(owner);
  const mintPubkey = new PublicKey(mintAddress);

  instructions.push(
    createApproveCheckedInstruction(
      accountPubKey,
      mintPubkey,
      destinationOwnerPubkey,
      ownerPubKey,
      amount,
      decimals,
      undefined,
      programId,
    ),
  );

  return appendMaybePriorityFeeInstructions(api, instructions, ownerPubKey);
};

export const buildRevokeTransactionInstructions = async (
  api: ChainAPI,
  { account, owner, tokenProgram }: TokenCreateRevokeCommand,
): Promise<TransactionInstruction[]> => {
  const instructions: TransactionInstruction[] = [];

  const programId = getTokenAccountProgramId(tokenProgram);

  const accountPubKey = new PublicKey(account);
  const ownerPubKey = new PublicKey(owner);

  instructions.push(createRevokeInstruction(accountPubKey, ownerPubKey, undefined, programId));

  return appendMaybePriorityFeeInstructions(api, instructions, ownerPubKey);
};

export async function findAssociatedTokenAccountPubkey(
  ownerAddress: string,
  mintAddress: string,
  tokenProgram: SolanaTokenProgram,
): Promise<PublicKey> {
  const ownerPubKey = new PublicKey(ownerAddress);
  const mintPubkey = new PublicKey(mintAddress);

  return getAssociatedTokenAddress(
    mintPubkey,
    ownerPubKey,
    undefined,
    getTokenAccountProgramId(tokenProgram),
  );
}

// TODO update to a shared method with getMaybeTokenMint
export const getMaybeMintAccount = async (
  address: string,
  api: ChainAPI,
): Promise<MintAccountInfo | undefined | Error> => {
  const accInfo = await api.getAccountInfo(address);

  const mintAccount =
    accInfo !== null && "parsed" in accInfo.data ? tryParseAsMintAccount(accInfo.data) : undefined;

  return mintAccount;
};

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

export const getMaybeTokenMint = async (
  address: string,
  api: ChainAPI,
): Promise<ParsedOnChainMintWithInfo | undefined | Error> => {
  const accInfo = await api.getAccountInfo(address);

  if (!accInfo || !("parsed" in accInfo.data)) return undefined;

  const mintOrError = tryParseAsMintAccount(accInfo.data);

  if (!mintOrError || mintOrError instanceof Error) return mintOrError;

  return {
    info: mintOrError,
    onChainAcc: accInfo as ParsedOnChainMintWithInfo["onChainAcc"],
  };
};

export const getMaybeTokenMintProgram = async (
  address: string,
  api: ChainAPI,
): Promise<SolanaTokenProgram | undefined | Error> => {
  const mintInfo = await api.getAccountInfo(address);

  return mintInfo !== null && "parsed" in mintInfo.data
    ? (mintInfo?.data.program as SolanaTokenProgram)
    : undefined;
};

export function getStakeAccountMinimumBalanceForRentExemption(api: ChainAPI) {
  return api.getMinimumBalanceForRentExemption(StakeProgram.space);
}

export async function getAccountMinimumBalanceForRentExemption(api: ChainAPI, address: string) {
  const accInfo = await api.getAccountInfo(address);
  const accSpace = accInfo !== null && "parsed" in accInfo.data ? accInfo.data.space : 0;

  return api.getMinimumBalanceForRentExemption(accSpace);
}

// for tokens2022 with interest bearing extension
export async function getTokenAccruedInterestDelta(
  api: ChainAPI,
  amount: BigNumber,
  magnitude: number,
  mint: string,
  payerAddress: string,
) {
  const transaction = new VersionedTransaction(
    new TransactionMessage({
      instructions: [
        createAmountToUiAmountInstruction(
          new PublicKey(mint),
          amount.toNumber(),
          TOKEN_2022_PROGRAM_ID,
        ),
      ],
      recentBlockhash: PublicKey.default.toString(),
      payerKey: new PublicKey(payerAddress),
    }).compileToV0Message(),
  );
  const { returnData } = (
    await api.connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    })
  ).value;

  if (!returnData?.data) return null;

  const accruedAmount = BigNumber(
    Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8"),
  ).multipliedBy(BigNumber(10).pow(magnitude));
  return accruedAmount.minus(amount).abs().decimalPlaces(0, 1);
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

export async function getPriorityFee(api: ChainAPI, accounts: string[]): Promise<number> {
  const recentFees = await api.getRecentPrioritizationFees(uniq(accounts));
  return median(recentFees.map(item => item.prioritizationFee));
}

export async function appendMaybePriorityFeeInstructions(
  api: ChainAPI,
  ixs: TransactionInstruction[],
  payer: PublicKey,
): Promise<TransactionInstruction[]> {
  const instructions = [...ixs];
  const writableAccs = instructions
    .map(ix => ix.keys.filter(acc => acc.isWritable).map(acc => acc.pubkey.toBase58()))
    .flat();
  const [priorityFeeIx, computeUnitsIx] = await Promise.all([
    buildMaybePriorityFeeInstruction(api, writableAccs),
    buildComputeUnitInstruction(api, instructions, payer),
  ]);

  if (priorityFeeIx) instructions.unshift(priorityFeeIx);
  if (computeUnitsIx) instructions.unshift(computeUnitsIx);
  return instructions;
}

export async function buildMaybePriorityFeeInstruction(
  api: ChainAPI,
  accounts: string[],
): Promise<TransactionInstruction | null> {
  const priorityFee = await getPriorityFee(api, accounts);
  if (priorityFee === 0) return null;

  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee,
  });
}
export async function buildComputeUnitInstruction(
  api: ChainAPI,
  ixs: TransactionInstruction[],
  payer: PublicKey,
): Promise<TransactionInstruction | null> {
  const computeUnits = await api.getSimulationComputeUnits(ixs, payer);
  // adding 10% more CPU to make sure it will work
  return computeUnits
    ? ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits * 0.1 + computeUnits })
    : null;
}

export function buildCreateAssociatedTokenAccountInstruction(
  api: ChainAPI,
  { mint, owner, associatedTokenAccountAddress }: TokenCreateATACommand,
): Promise<TransactionInstruction[]> {
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

  return appendMaybePriorityFeeInstructions(api, instructions, ownerPubKey);
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

  return appendMaybePriorityFeeInstructions(api, tx.instructions, withdrawAuthority);
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

  return appendMaybePriorityFeeInstructions(api, tx.instructions, withdrawAuthority);
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

  return appendMaybePriorityFeeInstructions(api, tx.instructions, withdrawAuthority);
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
  return appendMaybePriorityFeeInstructions(api, splitIx.instructions, basePk);
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
  return appendMaybePriorityFeeInstructions(api, tx.instructions, fromPubkey);
}
