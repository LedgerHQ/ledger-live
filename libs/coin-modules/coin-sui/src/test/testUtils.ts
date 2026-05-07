import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

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

  const suiClient = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("mainnet"),
    network: "mainnet",
  });
  const objects = await suiClient.multiGetObjects({
    ids: [...gasObjectIds, ...inputObjectIds],
    options: {
      showBcs: true,
      showPreviousTransaction: true,
      showStorageRebate: true,
      showOwner: true,
    },
  });

  const coinObjects = objects.filter(obj => {
    const bcsData = obj.data?.bcs as any;
    return bcsData.type.includes("coin");
  });

  const coinTypes: string[] = coinObjects.map(obj => (obj.data?.bcs as any).type);

  return coinTypes;
}

/**
 * Fetches a live SUI coin owned by dead address to use as gas payment in
 * integration tests that assert "sender does not own gas" failures.
 */
export async function fetchForeignOwnedSuiGasPayment(client: SuiJsonRpcClient) {
  const { data } = await client.getCoins({
    owner: "0x000000000000000000000000000000000000000000000000000000000000dead",
    coinType: "0x2::sui::SUI",
    limit: 1,
  });
  const coin = data[0];
  if (!coin) {
    throw new Error(
      "sui integ: no SUI coin returned for burn address; cannot build foreign-owned gas fixture",
    );
  }
  return [
    {
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    },
  ];
}
