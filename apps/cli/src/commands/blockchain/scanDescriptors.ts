import { deviceOpt, currencyOpt, CurrencyCommonOpts, DeviceCommonOpts } from "../../scan";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { scanDescriptors } from "@ledgerhq/coin-bitcoin/descriptor";
import { SignerContext } from "@ledgerhq/coin-bitcoin/lib/signer";
import Btc from "@ledgerhq/hw-app-btc";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

function requiredCurrency(c: CryptoCurrency | null | undefined) {
  if (!c) throw new Error("could not find currency");
  return c;
}

const createBitcoinSignerContext =
  (): SignerContext =>
  <T>(deviceId: string, currency: CryptoCurrency, fn: (signer: Btc) => Promise<T>): Promise<T> =>
    firstValueFrom(
      withDevice(deviceId)(transport => from(fn(new Btc({ transport, currency: currency.id })))),
    );

export type ScanDescriptorsJobOpts = CurrencyCommonOpts & DeviceCommonOpts;

export default {
  description: "Synchronize accounts with blockchain",
  args: [deviceOpt, currencyOpt],
  job: (opts: ScanDescriptorsJobOpts) =>
    scanDescriptors(
      opts.device || "",
      requiredCurrency(findCryptoCurrencyByKeyword(opts.currency || "bitcoin")),
      createBitcoinSignerContext(),
    ),
};
