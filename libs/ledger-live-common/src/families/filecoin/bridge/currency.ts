import { CurrencyBridge } from "@ledgerhq/types-live";
import { getAccountShape } from "./utils/utils";
import getAddressWrapper, { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Result,
  runDerivationScheme,
  DerivationMode,
  GetAddressOptions,
} from "@ledgerhq/coin-framework/derivation";
import { IterateResultBuilder } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { firstValueFrom, from } from "rxjs";
import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { withDevice } from "../../../hw/deviceAccess";
import Transport from "@ledgerhq/hw-transport";
import getAddress from "../../../hw/getAddress";

function getAddr(deviceId: string, opts: GetAddressOptions): Promise<Result> {
  return firstValueFrom(
    withDevice(deviceId)((transport: Transport) => from(getAddress(transport, opts))),
  );
}

const customIterateResultBuilder =
  (getAddressFn: GetAddressFn): IterateResultBuilder =>
  () =>
    Promise.resolve(
      async ({
        index,
        derivationsCache,
        derivationScheme,
        derivationMode,
        currency,
        deviceId,
      }: {
        index: number | string;
        derivationsCache: Record<string, Result>;
        derivationScheme: string;
        derivationMode: DerivationMode;
        currency: CryptoCurrency;
        deviceId: string;
      }): Promise<Result | null> => {
        const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
          address: index,
        });
        let res = derivationsCache[freshAddressPath];
        if (!res) {
          res = await getAddressWrapper(getAddressFn)(deviceId, {
            currency,
            path: freshAddressPath,
            derivationMode,
          });
          derivationsCache[freshAddressPath] = res;
        }
        return res as Result;
      },
    );

const buildIterateResult = customIterateResultBuilder(getAddr);

const scanAccounts = makeScanAccounts({ getAccountShape, buildIterateResult });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
