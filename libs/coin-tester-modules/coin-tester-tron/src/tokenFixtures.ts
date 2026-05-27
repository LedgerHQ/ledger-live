import { TronWeb } from "tronweb";
import { TRON_LOCAL_RPC } from "./fixtures";
import type { PrefundedAccount } from "./tronQuickstart";
import usdtArtifact from "./fixtures/usdt-trc20.json";

export type Trc10Asset = {
  /**
   * Numeric asset id assigned by the network (returned in `assetV2[].key`).
   * Used as the `tokenId` in transferAsset calls and as the subAccount key.
   */
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
};

function buildTronWeb(privateKey: string): TronWeb {
  return new TronWeb({ fullHost: TRON_LOCAL_RPC, privateKey });
}

/**
 * Issue a TRC10 asset from `issuer`. A given Tron account can only ever issue
 * one TRC10 — pick a prefunded account that won't be used as the test
 * funder/recipient.
 */
export async function issueTrc10(
  issuer: PrefundedAccount,
  opts: { name: string; abbr: string; totalSupply: number; precision?: number },
): Promise<Trc10Asset> {
  const tw = buildTronWeb(issuer.privateKey);
  const now = Date.now();
  const tx = await tw.transactionBuilder.createToken(
    {
      name: opts.name,
      abbreviation: opts.abbr,
      description: `Test asset ${opts.name}`,
      url: "https://example.com",
      totalSupply: opts.totalSupply,
      trxRatio: 1,
      tokenRatio: 1,
      precision: opts.precision ?? 0,
      saleStart: now + 5_000,
      saleEnd: now + 5 * 365 * 24 * 3600_000,
      freeBandwidth: 0,
      freeBandwidthLimit: 0,
      frozenAmount: 0,
      frozenDuration: 0,
    },
    issuer.address,
  );
  const signed = await tw.trx.sign(tx);
  const broadcast = await tw.trx.sendRawTransaction(signed);
  if (!broadcast.result) {
    throw new Error(`Issue TRC10 failed: ${JSON.stringify(broadcast)}`);
  }

  // Asset id is `assetV2[0].key` on the issuer's account, available after the
  // block is forged (~3s on tronbox/tre).
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const acc = (await tw.trx.getAccount(issuer.address)) as unknown as {
      assetV2?: Array<{ key: string }>;
    };
    const key = acc.assetV2?.[0]?.key;
    if (key) {
      return { assetId: key, name: opts.name, symbol: opts.abbr, decimals: opts.precision ?? 0 };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${opts.name} TRC10 to appear on issuer account`);
}

export async function transferTrc10(
  from: PrefundedAccount,
  toAddress: string,
  asset: Trc10Asset,
  amount: number,
): Promise<void> {
  const tw = buildTronWeb(from.privateKey);
  const tx = await tw.transactionBuilder.sendToken(toAddress, amount, asset.assetId, from.address);
  const signed = await tw.trx.sign(tx);
  const broadcast = await tw.trx.sendRawTransaction(signed);
  if (!broadcast.result) {
    throw new Error(`transfer TRC10 failed: ${JSON.stringify(broadcast)}`);
  }
}

export type Trc20Asset = {
  /** Tron base58 address of the freshly deployed contract. */
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
};

/**
 * Deploy a bit-for-bit copy of the canonical Tron USDT contract.
 * The bytecode + abi in fixtures/usdt-trc20.json are a snapshot of
 * TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t on mainnet.
 * To refresh:
 *   curl -s -X POST https://api.trongrid.io/wallet/getcontract \
 *     -H 'Content-Type: application/json' \
 *     -d '{"value":"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t","visible":true}'
 */
export async function deployTrc20(
  deployer: PrefundedAccount,
  opts: { name: string; symbol: string; decimals: number; initialSupply: bigint },
): Promise<Trc20Asset> {
  const tw = buildTronWeb(deployer.privateKey);
  const tx = await tw.transactionBuilder.createSmartContract(
    {
      abi: usdtArtifact.abi as unknown as { entrys: never[] },
      bytecode: usdtArtifact.bytecode,
      feeLimit: 1_000_000_000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10_000_000,
      parameters: [opts.initialSupply.toString(), opts.name, opts.symbol, opts.decimals],
    },
    deployer.address,
  );
  const signed = await tw.trx.sign(tx);
  const broadcast = await tw.trx.sendRawTransaction(signed);
  if (!broadcast.result) {
    throw new Error(`Deploy TRC20 failed: ${JSON.stringify(broadcast)}`);
  }
  const contractAddress = (tx as { contract_address?: string }).contract_address;
  if (!contractAddress) {
    throw new Error("createSmartContract did not return a contract_address");
  }
  const base58 = TronWeb.address.fromHex(contractAddress);

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const info = await tw.trx.getTransactionInfo(tx.txID);
    if ((info as { receipt?: { result?: string } }).receipt?.result === "SUCCESS") {
      return { contractAddress: base58, name: opts.name, symbol: opts.symbol, decimals: opts.decimals };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for TRC20 deploy at ${base58}`);
}

export async function transferTrc20(
  from: PrefundedAccount,
  toAddress: string,
  asset: Trc20Asset,
  amount: bigint,
): Promise<void> {
  const tw = buildTronWeb(from.privateKey);
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    asset.contractAddress,
    "transfer(address,uint256)",
    { feeLimit: 100_000_000, callValue: 0 },
    [
      { type: "address", value: toAddress },
      { type: "uint256", value: amount.toString() },
    ],
    from.address,
  );
  const signed = await tw.trx.sign(transaction);
  const broadcast = await tw.trx.sendRawTransaction(signed);
  if (!broadcast.result) {
    throw new Error(`transfer TRC20 failed: ${JSON.stringify(broadcast)}`);
  }
}
