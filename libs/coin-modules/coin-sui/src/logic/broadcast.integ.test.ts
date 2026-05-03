import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import coinConfig from "../config";
import { fetchForeignOwnedSuiGasPayment } from "../test/testUtils";
import { broadcast } from "./broadcast";

const executeOptions = {
  showInput: true,
  showBalanceChanges: true,
  showEffects: true,
  showEvents: true,
} as const;

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      node: {
        url: "https://sui.coin.ledger.com",
        graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
      },
      features: { graphql: false },
    }));
  });

  it("throws when sender does not match gas object owner", async () => {
    const client = new SuiJsonRpcClient({
      transport: new JsonRpcHTTPTransport({ url: coinConfig.getCoinConfig().node.url }),
      network: "mainnet",
    });
    const keypair = Ed25519Keypair.generate();
    const sender = keypair.toSuiAddress();

    const gasPayment = await fetchForeignOwnedSuiGasPayment(client);

    const tx = new Transaction();
    tx.setSender(sender);
    tx.setGasPrice(191);
    tx.setGasBudget("2358000");
    tx.setGasPayment(gasPayment);
    const [coin] = tx.splitCoins(tx.gas, [1000n]);
    tx.transferObjects([coin], sender);

    const unsigned = await tx.build({ client });
    const { signature } = await keypair.signTransaction(unsigned);
    const unsignedB64 = Buffer.from(unsigned).toString("base64");

    await expect(
      broadcast({ transactionBlock: unsignedB64, signature, options: executeOptions }, "sui"),
    ).rejects.toThrow(/Transaction was not signed by the correct sender/);
  });
});
