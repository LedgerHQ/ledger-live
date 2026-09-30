import {
  broadcastTransaction,
  bufferCV,
  compressPublicKey,
  contractPrincipalCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
  makeContractCall,
  principalCV,
  privateKeyToPublic,
  randomPrivateKey,
  signMessageHashRsv,
  uintCV,
  type TxBroadcastResult,
} from "@stacks/transactions";
import { STACKS_DEVNET_URL } from "./devnet";

const SIGNER_MANAGER_CONTRACT_NAME = "signer-manager-stub";
const AUTH_ID = 0;
// Clarinet's devnet uses testnet-versioned addresses; the client points at the local stacks-api.
const NETWORK = { network: "devnet", client: { baseUrl: STACKS_DEVNET_URL } } as const;
// Flat, like the scenarios' own fees: a fresh devnet has no fee-estimate history to price from.
const SETUP_TX_FEE = 20_000;

/** `broadcastTransaction` resolves to a rejection object (with `.error`/`.reason`), it does not
 * throw -- silently waiting on a rejected broadcast's `.txid` (present on every rejection variant
 * too) just times out with no diagnostic, which is exactly what happened before this check
 * existed. */
function assertBroadcastOk(result: TxBroadcastResult, context: string): void {
  if ("error" in result) {
    throw new Error(
      `coin-tester-stacks: ${context} broadcast rejected: ${result.reason} - ${result.error}`,
    );
  }
}

async function waitForTxSuccess(txid: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const url = `${STACKS_DEVNET_URL}/extended/v1/tx/${txid}`;

  while (Date.now() < deadline) {
    const res = await fetch(url);
    if (res.ok) {
      const body = (await res.json()) as { tx_status: string };
      if (body.tx_status === "success") return;
      if (body.tx_status !== "pending") {
        throw new Error(`coin-tester-stacks: transaction ${txid} failed (${body.tx_status})`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error(`coin-tester-stacks: transaction ${txid} did not confirm within ${timeoutMs}ms`);
}

/**
 * pox-5's `stake`/`unstake` (`buildUnsignedTx.ts`'s `buildStaking`) target a "signer manager"
 * contract principal as `intent.valAddress`. That contract must already be registered as a signer
 * on pox-5 (`register-signer`) with an active signer-key grant (`grant-signer-key`) -- both gated
 * by `contract-caller == signer-manager`, which only holds when `signer-manager-stub.clar`'s own
 * `relay-*` wrappers make the call, never a direct call from an externally-owned account. Run once,
 * before the scenario's delegate transaction, using the deployer as the fee-payer for both setup
 * calls (unrelated to the staker key the scenario later signs with).
 *
 * `poxContractId` is passed in (from a live `/v2/pox` read, same as `buildUnsignedTx.ts`'s own
 * `buildStaking`) rather than hardcoded: pox-5 is a separate, literally-named contract
 * (`ST...002AMW42H.pox-5`), not something `.pox` ever aliases to -- confirmed against
 * `stx-labs/clarinet`'s own devnet-automation reference (`chains_coordinator.rs`'s
 * `POX5_SIGNER_MANAGER_SOURCE`) and mainnet's live `/v2/pox`. Hardcoding the name a second time,
 * separately from `buildStaking`'s own resolution, is exactly the kind of drift that already broke
 * this file once.
 */
export async function setupSignerManager(
  deployerPrivateKey: string,
  deployerAddress: string,
  poxContractId: string,
): Promise<{ valAddress: string }> {
  const valAddress = `${deployerAddress}.${SIGNER_MANAGER_CONTRACT_NAME}`;
  const [poxContractAddress, poxContractName] = poxContractId.split(".");

  // pox-5's `signer-key` parameter is `(buff 33)`, so the public key must be compressed: an
  // uncompressed (65-byte) one is a `BadFunctionArgument` rejection. `randomPrivateKey` already
  // returns a compressed-convention key; `compressPublicKey` makes the 33 bytes explicit anyway.
  const signerKeyPrivate = randomPrivateKey();
  const signerKeyHex = compressPublicKey(privateKeyToPublic(signerKeyPrivate)).replace(/^0x/, "");
  const signerKeyBuffer = Buffer.from(signerKeyHex, "hex");

  const hashResult = await fetchCallReadOnlyFunction({
    contractAddress: poxContractAddress,
    contractName: poxContractName,
    functionName: "get-signer-grant-message-hash",
    functionArgs: [principalCV(valAddress), uintCV(AUTH_ID)],
    senderAddress: deployerAddress,
    ...NETWORK,
  });
  const decodedHash = cvToJSON(hashResult);
  const messageHash = (decodedHash.value as string).replace(/^0x/, "");

  const signerSigHex = signMessageHashRsv({
    messageHash,
    privateKey: signerKeyPrivate,
  }).replace(/^0x/, "");

  const grantTx = await makeContractCall({
    contractAddress: deployerAddress,
    contractName: SIGNER_MANAGER_CONTRACT_NAME,
    functionName: "relay-grant-signer-key",
    functionArgs: [
      bufferCV(signerKeyBuffer),
      uintCV(AUTH_ID),
      bufferCV(Buffer.from(signerSigHex, "hex")),
    ],
    senderKey: deployerPrivateKey,
    fee: SETUP_TX_FEE,
    ...NETWORK,
  });
  const grantResult = await broadcastTransaction({ transaction: grantTx, ...NETWORK });
  assertBroadcastOk(grantResult, "relay-grant-signer-key");
  await waitForTxSuccess(grantResult.txid, 5 * 60 * 1000);

  const registerTx = await makeContractCall({
    contractAddress: deployerAddress,
    contractName: SIGNER_MANAGER_CONTRACT_NAME,
    functionName: "relay-register-signer",
    // Supplied here, not as a `.signer-manager-stub` literal inside the contract's own source --
    // see `signer-manager-stub.clar`'s comment on `relay-register-signer` for why (a self-reference
    // there makes Clarinet's deployment-plan generator reject the contract as circular).
    functionArgs: [
      contractPrincipalCV(deployerAddress, SIGNER_MANAGER_CONTRACT_NAME),
      bufferCV(signerKeyBuffer),
    ],
    senderKey: deployerPrivateKey,
    fee: SETUP_TX_FEE,
    ...NETWORK,
  });
  const registerResult = await broadcastTransaction({ transaction: registerTx, ...NETWORK });
  assertBroadcastOk(registerResult, "relay-register-signer");
  await waitForTxSuccess(registerResult.txid, 5 * 60 * 1000);

  return { valAddress };
}
