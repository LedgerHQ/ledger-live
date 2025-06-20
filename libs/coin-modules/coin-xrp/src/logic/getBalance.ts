import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getAccountInfo, getServerInfos } from "../network";
import { XrpAsset } from "../types";
import { parseAPIValue } from "./common";

export async function getBalance(address: string): Promise<Balance<XrpAsset>[]> {
  const accountInfo = await getAccountInfo(address);
  const serverInfo = await getServerInfos();

  const reserveMinXRP = parseAPIValue(serverInfo.info.validated_ledger.reserve_base_xrp.toString());
  const reservePerTrustline = parseAPIValue(
    serverInfo.info.validated_ledger.reserve_inc_xrp.toString(),
  );
  const trustlines = accountInfo.ownerCount;

  const locked = reserveMinXRP.plus(reservePerTrustline.times(trustlines));
  return [
    {
      value: BigInt(accountInfo.balance),
      asset: { type: "native" },
      locked: BigInt(locked.toString()),
    },
  ];
}
