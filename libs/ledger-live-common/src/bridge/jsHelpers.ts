import { firstValueFrom, from } from "rxjs";
import { makeAccountBridgeReceive as commonMakeAccountBridgeReceive } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../hw/deviceAccess";
import getAddress from "../hw/getAddress";

export {
  type AccountShapeInfo,
  type GetAccountShape,
  type IterateResultBuilder,
  makeSync,
  mergeNfts,
  mergeOps,
  sameOp,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";

export function getAddr(deviceId: string, opts: GetAddressOptions): Promise<Result> {
  return firstValueFrom(
    withDevice(deviceId)((transport: Transport) => from(getAddress(transport, opts))),
  );
}

export function makeAccountBridgeReceive({
  injectGetAddressParams,
}: {
  injectGetAddressParams?: (account: Account) => any;
} = {}) {
  return commonMakeAccountBridgeReceive(getAddr, {
    injectGetAddressParams,
  });
}
