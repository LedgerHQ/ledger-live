import {
  Authorized,
  Connection,
  Keypair,
  PublicKey,
  StakeProgram,
  VoteAccountInfo,
} from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotent, mintTo } from "@solana/spl-token";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SolanaTokenProgram } from "@ledgerhq/coin-solana/types";
import { getTokenAccountProgramId } from "@ledgerhq/coin-solana/helpers/token";

const connection = new Connection("http://localhost:8899", "confirmed");
// `PAYER` is also the mint authority of the cloned tokens
// Its account has been generated in advance and matches the config
// files of the mints imported to the local validator.
export const PAYER = Keypair.fromSecretKey(
  new Uint8Array([
    106, 140, 173, 68, 60, 80, 178, 22, 162, 223, 12, 252, 75, 42, 171, 162, 225, 204, 149, 90, 160,
    2, 101, 125, 141, 63, 242, 34, 213, 248, 136, 55, 228, 139, 221, 54, 104, 25, 194, 28, 148, 39,
    66, 46, 134, 124, 236, 14, 231, 64, 203, 2, 197, 89, 192, 54, 235, 156, 15, 144, 10, 96, 17,
    207,
  ]),
);
export const STAKE_ACCOUNT = Keypair.generate();
export let VOTE_ACCOUNT: VoteAccountInfo | null = null;

export async function createSplAccount(
  address: string,
  currency: TokenCurrency,
  amount: number,
  program: SolanaTokenProgram,
) {
  const programId = getTokenAccountProgramId(program);
  const associatedTokenAddress = await createAssociatedTokenAccountIdempotent(
    connection,
    PAYER,
    new PublicKey(currency.contractAddress),
    new PublicKey(address),
    undefined,
    programId,
  );
  const latest = await connection.getLatestBlockhash();
  const signature = await mintTo(
    connection,
    PAYER,
    new PublicKey(currency.contractAddress),
    associatedTokenAddress,
    PAYER,
    amount * 10 ** currency.units[0].magnitude,
    [],
    undefined,
    programId,
  );
  await connection.confirmTransaction({ signature, ...latest });
}

export async function initVoteAccount() {
  const voteAccounts = await connection.getVoteAccounts();
  VOTE_ACCOUNT = voteAccounts.current[0];
}

export async function initStakeAccount(address: string, amount: number) {
  const authority = new PublicKey(address);
  const transaction = StakeProgram.createAccount({
    fromPubkey: PAYER.publicKey,
    stakePubkey: STAKE_ACCOUNT.publicKey,
    authorized: new Authorized(authority, authority),
    lamports: amount,
  });
  const latest = await connection.getLatestBlockhash();
  transaction.feePayer = PAYER.publicKey;
  transaction.recentBlockhash = latest.blockhash;
  transaction.lastValidBlockHeight = latest.lastValidBlockHeight;
  transaction.sign(PAYER, STAKE_ACCOUNT);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction({ signature, ...latest });
}
