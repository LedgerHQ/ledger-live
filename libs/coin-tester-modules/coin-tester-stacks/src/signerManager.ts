import { StacksMocknet } from "@stacks/network";
import {
  AnchorMode,
  broadcastTransaction,
  bufferCV,
  callReadOnlyFunction,
  compressPublicKey,
  contractPrincipalCV,
  cvToJSON,
  getPublicKey,
  makeContractCall,
  makeRandomPrivKey,
  principalCV,
  publicKeyToString,
  signMessageHashRsv,
  uintCV,
  type TxBroadcastResult,
} from "@stacks/transactions";
import { STACKS_DEVNET_URL } from "./devnet";

const SIGNER_MANAGER_CONTRACT_NAME = "signer-manager-stub";
const AUTH_ID = 0;

/** `broadcastTransaction` resolves to a rejection object (with `.error`/`.reason`), it does not
 * throw -- silently waiting on a rejected broadcast's `.txid` (present on every rejection variant
 * too) just times out with no diagnostic, which is exactly what happened before this check
 * existed. */
function assertBroadcastOk(result: TxBroadcastResult, context: string): void {
  if (result.error !== undefined) {
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
 *
 * Targets `@stacks/transactions@6.17.0`/`@stacks/network@6.17.0` (this package's own pinned
 * version, distinct from `coin-stacks`'s v7 -- verified against the installed `dist/*.d.ts`, not
 * assumed): `StacksPrivateKey`/`StacksPublicKey` are objects here, not the hex strings v7 uses,
 * and network/client plumbing is a single `StacksNetwork` instance, not a `{client: {baseUrl}}`
 * pair. `signer.ts`'s already-working legacy signer is the existing proof that v6-signed,
 * v6-broadcast transactions interoperate fine with `coin-stacks`'s v7-crafted transaction bytes
 * (the wire format is a protocol fact, not an SDK-version fact).
 */
export async function setupSignerManager(
  deployerPrivateKey: string,
  deployerAddress: string,
  poxContractId: string,
): Promise<{ valAddress: string }> {
  const valAddress = `${deployerAddress}.${SIGNER_MANAGER_CONTRACT_NAME}`;
  const network = new StacksMocknet({ url: STACKS_DEVNET_URL });
  const [poxContractAddress, poxContractName] = poxContractId.split(".");

  // `makeRandomPrivKey`'s underlying `@noble/secp256k1` key is a raw 32-byte value, not the
  // 33-byte "compressed" Stacks private-key convention (`DEPLOYER_PRIVATE_KEY` has that trailing
  // marker byte; this generated one doesn't) -- so `getPublicKey`'s own compression inference
  // silently derives an *uncompressed* (65-byte) public key here. pox-5's `signer-key` parameter
  // is `(buff 33)`; broadcasting the uncompressed one is a real `BadFunctionArgument` rejection,
  // verified empirically. `compressPublicKey` sidesteps the private key's own convention entirely.
  const signerKeyPrivate = makeRandomPrivKey();
  const signerKeyHex = publicKeyToString(
    compressPublicKey(getPublicKey(signerKeyPrivate).data),
  ).replace(/^0x/, "");
  const signerKeyBuffer = Buffer.from(signerKeyHex, "hex");

  const hashResult = await callReadOnlyFunction({
    contractAddress: poxContractAddress,
    contractName: poxContractName,
    functionName: "get-signer-grant-message-hash",
    functionArgs: [principalCV(valAddress), uintCV(AUTH_ID)],
    senderAddress: deployerAddress,
    network,
  });
  const decodedHash = cvToJSON(hashResult);
  const messageHash = (decodedHash.value as string).replace(/^0x/, "");

  const signerSigHex = signMessageHashRsv({
    messageHash,
    privateKey: signerKeyPrivate,
  }).data.replace(/^0x/, "");

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
    anchorMode: AnchorMode.Any,
    network,
  });
  const grantResult = await broadcastTransaction(grantTx, network);
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
    anchorMode: AnchorMode.Any,
    network,
  });
  const registerResult = await broadcastTransaction(registerTx, network);
  assertBroadcastOk(registerResult, "relay-register-signer");
  await waitForTxSuccess(registerResult.txid, 5 * 60 * 1000);

  return { valAddress };
}
