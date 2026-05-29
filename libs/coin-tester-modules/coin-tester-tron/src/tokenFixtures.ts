import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fundAccount, makeWitnessTronWeb, waitForTxConfirmation } from "./node";

export interface Trc10Fixture {
  /** Numeric token id returned by `createassetissue`. */
  tokenId: string;
  name: string;
  abbr: string;
  precision: number;
  /** Token id usable in coin-tron's CAL lookup (`tron/trc10/<id>`). */
  calTokenId: string;
}

export interface Trc20Fixture {
  /** Base58Check T-prefix contract address. */
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  /** Token id usable in coin-tron's CAL lookup (`tron/trc20/<contractAddress>`). */
  calTokenId: string;
}

const TOTAL_SUPPLY_TRC10 = 1_000_000_000_000n;
const INITIAL_TEST_BALANCE_TRC10 = 1_000_000_000n;

const TOTAL_SUPPLY_TRC20 = 1_000_000_000_000n;
const INITIAL_TEST_BALANCE_TRC20 = 1_000_000_000n;

/**
 * Minimal compiled TRC-20 (`Wrapped TRON / WTRX`, ~3 KB bytecode, solc 0.8.6).
 * OpenZeppelin ERC-20 base + a public `mint(address,uint256)`. No constructor
 * args (name/symbol hardcoded, 18 decimals default).
 *
 * Heavier candidates (Tether USDT, TestToken-with-admin) hit the
 * `trontools/quickstart` 1 B-sun fee-limit cap on deployment. This contract
 * stays well under it.
 *
 * Mirrored from ze-xe/contracts-0
 * (https://github.com/ze-xe/contracts-0/blob/main/build/contracts/TRX.json).
 */
const TRC20_ARTIFACT_PATH = join(__dirname, "trc20.minimal.json");

interface Trc20Artifact {
  abi: object[];
  bytecode: string;
}

function loadTrc20Artifact(): Trc20Artifact {
  const raw = readFileSync(TRC20_ARTIFACT_PATH, "utf8");
  const parsed = JSON.parse(raw) as Trc20Artifact;
  if (!parsed.bytecode || !parsed.abi?.length) {
    throw new Error(`Invalid TRC-20 artifact at ${TRC20_ARTIFACT_PATH}`);
  }
  return parsed;
}

/**
 * Issues a TRC-10 asset from the witness account, then transfers an initial
 * balance to `testAccountAddress`. Returns the numeric tokenId.
 */
export async function deployTrc10(testAccountAddress: string): Promise<Trc10Fixture> {
  const tronWeb = makeWitnessTronWeb();
  // Activate the destination account before issuing — `transferAsset` fails on
  // unactivated accounts.
  await fundAccount(testAccountAddress, 10_000_000);

  const name = "TestTRC10";
  const abbr = "TT10";
  // `precision` is intentionally omitted (defaults to 0). The older java-tron
  // HTTP API shipped by `trontools/quickstart` silently rejects the contract
  // when `precision != 0`. Treating TRC-10 as integer-precision is fine here:
  // the scenario uses raw integer amounts via BigNumber.
  const precision = 0;

  const witnessAddress = tronWeb.defaultAddress.base58 as string;
  const issueUnsigned = await tronWeb.transactionBuilder.createToken(
    {
      name,
      abbreviation: abbr,
      description: "Coin tester TRC-10 fixture",
      url: "https://ledger.com",
      totalSupply: Number(TOTAL_SUPPLY_TRC10),
      trxRatio: 1,
      tokenRatio: 1,
      saleStart: Date.now() + 5_000,
      saleEnd: Date.now() + 5_000 + 30 * 24 * 3600 * 1000,
      freeBandwidth: 0,
      freeBandwidthLimit: 0,
      frozenAmount: 0,
      frozenDuration: 0,
    },
    witnessAddress,
  );
  const issueSigned = await tronWeb.trx.sign(issueUnsigned);
  const issueResult = await tronWeb.trx.sendRawTransaction(issueSigned);
  if (!issueResult.result) {
    throw new Error(`createToken broadcast failed: ${JSON.stringify(issueResult)}`);
  }
  const issueTxID = issueResult.txid ?? issueSigned.txID;
  // The issued tokenId is returned directly in the tx receipt as `assetIssueID`.
  // Use the full-node receipt (returned by waitForTxConfirmation) — TronWeb's
  // `getTransactionInfo` hits the solidity node which lags by ~20 blocks.
  const issueInfo = await waitForTxConfirmation(issueTxID);
  const tokenId = (issueInfo as { assetIssueID?: string }).assetIssueID;
  if (!tokenId) {
    throw new Error(
      `deployTrc10: missing assetIssueID on tx receipt ${issueTxID}: ${JSON.stringify(issueInfo)}`,
    );
  }

  const sendUnsigned = await tronWeb.transactionBuilder.sendToken(
    testAccountAddress,
    Number(INITIAL_TEST_BALANCE_TRC10),
    tokenId,
    witnessAddress,
  );
  const sendSigned = await tronWeb.trx.sign(sendUnsigned);
  const sendResult = await tronWeb.trx.sendRawTransaction(sendSigned);
  if (!sendResult.result) {
    throw new Error(`TRC-10 transfer broadcast failed: ${JSON.stringify(sendResult)}`);
  }
  await waitForTxConfirmation(sendResult.txid ?? sendSigned.txID);

  return {
    tokenId,
    name,
    abbr,
    precision,
    calTokenId: `tron/trc10/${tokenId}`,
  };
}

/**
 * Deploys the official TetherToken (USDT) bytecode on the local node, then
 * transfers an initial balance to `testAccountAddress`. The bytecode is the
 * same one in production on Ethereum mainnet (and re-used for USDT on Tron),
 * compiled with solc 0.4.18. Source: argentlabs/argent-contracts mirror.
 */
export async function deployTrc20(testAccountAddress: string): Promise<Trc20Fixture> {
  const { abi, bytecode } = loadTrc20Artifact();
  const tronWeb = makeWitnessTronWeb();
  const witnessAddress = tronWeb.defaultAddress.base58 as string;
  // Hardcoded by the contract: name = "Wrapped TRON", symbol = "WTRX", decimals = 18.
  const name = "Wrapped TRON";
  const symbol = "WTRX";
  const decimals = 18;

  // Constructor takes no args.
  const deployUnsigned = await tronWeb.transactionBuilder.createSmartContract(
    {
      abi,
      bytecode,
      parameters: [],
      feeLimit: 1_000_000_000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10_000_000,
      name: "WTRX",
    },
    witnessAddress,
  );
  const deploySigned = await tronWeb.trx.sign(deployUnsigned);
  const deployResult = await tronWeb.trx.sendRawTransaction(deploySigned);
  if (!deployResult.result) {
    throw new Error(`TRC-20 deploy broadcast failed: ${JSON.stringify(deployResult)}`);
  }
  const deployTxID = deployResult.txid ?? deploySigned.txID;
  await waitForTxConfirmation(deployTxID);
  const contractAddress = tronWeb.address.fromHex(deployUnsigned.contract_address as string);

  // Seed initial balance via `mint(address,uint256)` (public, no auth on this fixture).
  const mintUnsigned = await tronWeb.transactionBuilder.triggerSmartContract(
    contractAddress,
    "mint(address,uint256)",
    { feeLimit: 100_000_000, callValue: 0 },
    [
      { type: "address", value: testAccountAddress },
      { type: "uint256", value: INITIAL_TEST_BALANCE_TRC20.toString() },
    ],
    witnessAddress,
  );
  const mintSigned = await tronWeb.trx.sign(mintUnsigned.transaction);
  const mintResult = await tronWeb.trx.sendRawTransaction(mintSigned);
  if (!mintResult.result) {
    throw new Error(`TRC-20 mint broadcast failed: ${JSON.stringify(mintResult)}`);
  }
  await waitForTxConfirmation(mintResult.txid ?? mintSigned.txID);

  return {
    contractAddress,
    name,
    symbol,
    decimals,
    calTokenId: `tron/trc20/${contractAddress}`,
  };
}
