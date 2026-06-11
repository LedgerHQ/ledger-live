import { TronWeb } from "tronweb";
import { TRON_LOCAL_RPC } from "./fixtures";
import usdtArtifact from "./fixtures/usdt-trc20.json";
import type { PrefundedAccount } from "./tronbox";

export type Trc10Asset = { assetId: string; name: string; symbol: string; decimals: number };
export type Trc20Asset = {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
};

function tronWeb(privateKey: string): TronWeb {
  return new TronWeb({ fullHost: TRON_LOCAL_RPC, privateKey });
}

async function poll<T>(fn: () => Promise<T | null | undefined>, label: string): Promise<T> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const out = await fn();
    if (out) return out;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

export async function issueTrc10(
  issuer: PrefundedAccount,
  opts: { name: string; abbr: string; totalSupply: number; precision?: number },
): Promise<Trc10Asset> {
  const tw = tronWeb(issuer.privateKey);
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
  const broadcast = await tw.trx.sendRawTransaction(await tw.trx.sign(tx));
  if (!broadcast.result) throw new Error(`Issue TRC10 failed: ${JSON.stringify(broadcast)}`);

  const assetId = await poll(async () => {
    const acc = (await tw.trx.getAccount(issuer.address)) as unknown as {
      assetV2?: Array<{ key: string }>;
    };
    return acc.assetV2?.[0]?.key;
  }, `${opts.name} TRC10 to appear on issuer`);
  return { assetId, name: opts.name, symbol: opts.abbr, decimals: opts.precision ?? 0 };
}

// Bytecode + abi in fixtures/usdt-trc20.json are a snapshot of mainnet USDT
// (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t). Refresh:
//   curl -sX POST https://api.trongrid.io/wallet/getcontract -H 'Content-Type: application/json' \
//     -d '{"value":"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t","visible":true}'
export async function deployTrc20(
  deployer: PrefundedAccount,
  opts: { name: string; symbol: string; decimals: number; initialSupply: bigint },
): Promise<Trc20Asset> {
  const tw = tronWeb(deployer.privateKey);
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
  const broadcast = await tw.trx.sendRawTransaction(await tw.trx.sign(tx));
  if (!broadcast.result) throw new Error(`Deploy TRC20 failed: ${JSON.stringify(broadcast)}`);
  const hex = (tx as { contract_address?: string }).contract_address;
  if (!hex) throw new Error("createSmartContract did not return a contract_address");
  const contractAddress = TronWeb.address.fromHex(hex);

  await poll(async () => {
    const info = (await tw.trx.getTransactionInfo(tx.txID)) as { receipt?: { result?: string } };
    return info.receipt?.result === "SUCCESS" ? true : null;
  }, `TRC20 deploy at ${contractAddress}`);
  return { contractAddress, name: opts.name, symbol: opts.symbol, decimals: opts.decimals };
}
