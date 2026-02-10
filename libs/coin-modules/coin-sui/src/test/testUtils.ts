import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
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

  const suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
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
