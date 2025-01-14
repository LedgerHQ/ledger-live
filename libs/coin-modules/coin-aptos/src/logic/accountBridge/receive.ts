import getAddressWrapper from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { makeAccountBridgeReceive } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import signerGetAddress from "../../signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { AptosSigner } from "../../types";
import { Observable } from "rxjs";
import { Result } from "@ledgerhq/coin-framework/lib/derivation";
import { Account } from "@ledgerhq/types-live";

type receiveCallback = (
  account: Account,
  {
    verify,
    deviceId,
    path,
  }: { verify?: boolean; deviceId: string; subAccountId?: string; path?: string },
) => Observable<Result>;

export function receive(signerContext: SignerContext<AptosSigner>): receiveCallback {
  const getAddress = signerGetAddress(signerContext);
  const getAddressFn = getAddressWrapper(getAddress);

  return makeAccountBridgeReceive(getAddressFn);
}
