import { firstValueFrom, from } from "rxjs";
import type { GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { withDevice } from "../../hw/deviceAccess";
import getAddress from "../../hw/getAddress/index";
import { findCryptoCurrencyByKeyword } from "../../currencies/index";
import type { GetAddressOpts } from "../runCli";

export async function cmdGetAddress(opts: GetAddressOpts): Promise<GetAddressResult> {
  const currency = opts.currency ? findCryptoCurrencyByKeyword(opts.currency) : undefined;
  if (!currency) throw new Error("no currency provided");
  if (!opts.path) throw new Error("--path is required");

  return firstValueFrom(
    withDevice(opts.device || "")(t =>
      from(
        getAddress(t, {
          currency,
          path: opts.path as string,
          derivationMode: asDerivationMode(opts.derivationMode || ""),
          verify: opts.verify,
        }),
      ),
    ),
  );
}
