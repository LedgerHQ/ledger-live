import { ApiPromise, HttpProvider } from "@polkadot/api";
import { getCoinConfig } from "../../config";

let api: ApiPromise | undefined;
export default async function () {
  if (!api) {
    const headers = getCoinConfig().node.credential
      ? { Authorization: "Basic " + getCoinConfig().node.credential }
      : undefined;
    api = await ApiPromise.create({
      provider: new HttpProvider(getCoinConfig().node.url, headers),
      noInitWarn: true, //to avoid undesired warning (ex: "API/INIT: polkadot/1002000: Not decorating unknown runtime apis")
    });
  }

  return api;
}
