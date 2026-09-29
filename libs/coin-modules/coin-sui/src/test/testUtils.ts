import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { createSuiGrpcClient } from "../network/grpc/client";

const MAINNET_GRPC_URL = "https://fullnode.mainnet.sui.io:443";

export async function extractCoinTypeFromUnsignedTx(
  unsignedTxBytes: Uint8Array,
): Promise<string[] | null> {
  const tx = Transaction.from(unsignedTxBytes);
  const data = tx.getData();

  const gasObjectIds = data.gasData.payment?.map(object => object.objectId) ?? [];
  const inputObjectIds = data.inputs
    .map(input => {
      return input.$kind === "Object" && input.Object.$kind === "ImmOrOwnedObject"
        ? input.Object.ImmOrOwnedObject.objectId
        : null;
    })
    .filter((objectId): objectId is string => !!objectId);

  const client = createSuiGrpcClient({ url: MAINNET_GRPC_URL });
  const { objects } = await client.core.getObjects({
    objectIds: [...gasObjectIds, ...inputObjectIds],
  });

  return objects.flatMap(obj =>
    obj instanceof Error || !obj.type.includes("coin") ? [] : [obj.type],
  );
}

/**
 * Fetches a live SUI coin owned by dead address to use as gas payment in
 * integration tests that assert "sender does not own gas" failures.
 */
export async function fetchForeignOwnedSuiGasPayment(client: SuiGrpcClient) {
  const { objects } = await client.core.listCoins({
    owner: "0x000000000000000000000000000000000000000000000000000000000000dead",
    coinType: "0x2::sui::SUI",
    limit: 1,
  });
  const coin = objects[0];
  if (!coin) {
    throw new Error(
      "sui integ: no SUI coin returned for burn address; cannot build foreign-owned gas fixture",
    );
  }
  return [{ objectId: coin.objectId, version: coin.version, digest: coin.digest }];
}
