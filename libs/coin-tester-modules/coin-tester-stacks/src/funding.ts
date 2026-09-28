import { StacksMocknet } from "@stacks/network";
import {
  AnchorMode,
  broadcastTransaction,
  createAssetInfo,
  FungibleConditionCode,
  makeContractCall,
  makeStandardFungiblePostCondition,
  noneCV,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { STACKS_DEVNET_URL } from "./devnet";
import {
  DEPLOYER_ADDRESS,
  DEPLOYER_PRIVATE_KEY,
  TOKEN_ASSET_NAME,
  TOKEN_CONTRACT_NAME,
} from "./fixtures";
import { assertBroadcastOk, waitForTxSuccess } from "./signerManager";

// Flat, like the scenarios' own fees: a fresh devnet has no fee-estimate history for this payload.
const FUNDING_FEE = 10_000;

/**
 * Sends `amount` test-token base units from the deployer (which holds the whole supply,
 * `sip-010-test-token.clar` has no public mint) to `recipient`, and waits until it is confirmed.
 * Each send scenario funds its own sender this way, so it starts with a token balance and an
 * otherwise-empty history on the shared devnet.
 *
 * Carries an explicit post-condition (the deployer sends exactly `amount`) rather than
 * `PostConditionMode.Allow`: `makeContractCall` defaults to `Deny` in `@stacks/transactions`
 * 6.17.0, which aborts any asset transfer not covered by a post-condition.
 */
export async function fundTestToken(recipient: string, amount: bigint): Promise<void> {
  const network = new StacksMocknet({ url: STACKS_DEVNET_URL });

  const tx = await makeContractCall({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: TOKEN_CONTRACT_NAME,
    functionName: "transfer",
    functionArgs: [uintCV(amount), principalCV(DEPLOYER_ADDRESS), principalCV(recipient), noneCV()],
    postConditions: [
      makeStandardFungiblePostCondition(
        DEPLOYER_ADDRESS,
        FungibleConditionCode.Equal,
        amount,
        createAssetInfo(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, TOKEN_ASSET_NAME),
      ),
    ],
    fee: FUNDING_FEE,
    senderKey: DEPLOYER_PRIVATE_KEY,
    anchorMode: AnchorMode.Any,
    network,
  });
  const result = await broadcastTransaction(tx, network);
  assertBroadcastOk(result, "test-token funding transfer");
  await waitForTxSuccess(result.txid, 5 * 60 * 1000);
}
