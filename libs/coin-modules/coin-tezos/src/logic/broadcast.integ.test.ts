import { InMemorySigner } from "@taquito/signer";
import { OpKind, TezosToolkit } from "@taquito/taquito";
import { broadcast } from "./broadcast";
import coinConfig from "../config";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      () =>
        ({
          status: { type: "active" },
          node: {
            url: "https://xtz-node.api.live.ledger.com",
          },
        }) as any,
    );
  });

  it("throws on insufficient funds", async () => {
    const tezos = new TezosToolkit("https://xtz-node.api.live.ledger.com");
    const signer = await InMemorySigner.fromSecretKey(
      "edsk4XGmciSU5EhXZK7nzw647RAkQ3Lgig4AUAqEzYzL4SHcZjRaoU",
    );

    tezos.setProvider({ signer });

    const head = await tezos.rpc.getBlockHeader();
    const pkh = await signer.publicKeyHash();

    const prepared = await tezos.rpc.forgeOperations({
      branch: head.hash,
      contents: [
        {
          kind: OpKind.TRANSACTION,
          source: pkh,
          fee: "1000",
          counter: "1",
          gas_limit: "10600",
          storage_limit: "300",
          amount: "1",
          destination: pkh,
        },
      ],
    });
    const { sbytes } = await signer.sign(prepared, new Uint8Array([3]));

    await expect(broadcast(sbytes)).rejects.toThrow(/Empty implicit contract/);
  });
});
