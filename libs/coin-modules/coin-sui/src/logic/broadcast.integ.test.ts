import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import coinConfig from "../config";
import { createSuiGrpcClient } from "../network/grpc/client";
import { withoutBuildSimulation } from "../network/sdk.grpc";
import { fetchForeignOwnedSuiGasPayment } from "../test/testUtils";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      node: {
        graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
        grpcUrl: "https://sui.coin.ledger.com",
      },
      features: { transport: "grpc" },
      name: "Sui",
      unit: { name: "Sui", code: "SUI", magnitude: 9 },
    }));
  });

  it("throws when sender does not match gas object owner", async () => {
    // Without the build-time simulation, the ownership failure surfaces at broadcast.
    const client = withoutBuildSimulation(
      createSuiGrpcClient({ url: coinConfig.getCoinConfig().node.grpcUrl }),
    );
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
      broadcast(coinConfig.getCoinConfig(), {
        transactionBlock: unsignedB64,
        signature,
      }),
    ).rejects.toThrow(/Transaction was not signed by the correct sender/);
  });
});
