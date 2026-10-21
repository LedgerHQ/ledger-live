import {
  Authorized,
  Connection,
  Keypair,
  PublicKey,
  StakeProgram,
  VoteAccountInfo,
} from "@solana/web3.js";

// The RPC of the coin-sandbox instance, known once it is up
let rpcUrl: string | undefined;

export function setSolanaRpc(url: string): void {
  rpcUrl = url;
}

// Fresh Connection per call to avoid stale blockhash cache across validator restarts
function getConnection() {
  if (rpcUrl === undefined) throw new Error("the Solana RPC is not set: is the sandbox up?");
  return new Connection(rpcUrl, "confirmed");
}
export const STAKE_ACCOUNT = Keypair.generate();
export let VOTE_ACCOUNT: VoteAccountInfo | null = null;

export async function initVoteAccount() {
  const voteAccounts = await getConnection().getVoteAccounts();
  VOTE_ACCOUNT = voteAccounts.current[0];
}

// Creates the stake account `address` can activate: initialized, not delegated, `address` is staker
// and withdrawer. `payer` funds it and pays the fees.
export async function initStakeAccount(payer: Keypair, address: string, amount: number) {
  const connection = getConnection();
  const authority = new PublicKey(address);
  const transaction = StakeProgram.createAccount({
    fromPubkey: payer.publicKey,
    stakePubkey: STAKE_ACCOUNT.publicKey,
    authorized: new Authorized(authority, authority),
    lamports: amount,
  });
  const latest = await connection.getLatestBlockhash();
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = latest.blockhash;
  transaction.lastValidBlockHeight = latest.lastValidBlockHeight;
  transaction.sign(payer, STAKE_ACCOUNT);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction({ signature, ...latest });
}
