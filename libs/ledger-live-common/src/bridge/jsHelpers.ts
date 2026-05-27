import { firstValueFrom, from } from "rxjs";
import { makeAccountBridgeReceive as commonMakeAccountBridgeReceive } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import type {
  GetAddressOptions,
  GetAddressResult,
} from "@ledgerhq/ledger-wallet-framework/derivation";
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
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";

export function getAddr(deviceId: string, opts: GetAddressOptions): Promise<GetAddressResult> {
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
