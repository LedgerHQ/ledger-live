import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import coinConfig from "../config";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";

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

export function setupSdkTestEnv() {
  // NOTE: as our sui proxy whitelists calls, we need to explicitely set the LEDGER_CLIENT_VERSION
  // in turn it will be used in the headers of those api calls.
  setEnvUnsafe("LEDGER_CLIENT_VERSION", "lld/2.124.0-dev");

  coinConfig.setCoinConfig(() => ({
    status: {
      type: "active",
    },
    node: {
      url: getEnv("API_SUI_NODE_PROXY"),
    },
  }));
}
