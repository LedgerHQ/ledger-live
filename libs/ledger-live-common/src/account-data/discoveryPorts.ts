import { firstValueFrom, from } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getChainAdapter } from "@ledgerhq/coin-bitcoin/chain-adapters/registry";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/networks";
import type { DerivedKey, DeriveRequest } from "@features/platform-account-discovery";
import { withDevice } from "../hw/deviceAccess";
import getAddress from "../hw/getAddress";
import { signerContext } from "../families/bitcoin/setup";

/**
 * The key of an account, derived on the connected device with the legacy resolvers, so the account
 * is the one `scanAccounts` would have found. The bitcoin family is known by its xpub at the account
 * path; every other family by the address at the full path.
 */
export function deriveOnDevice(deviceId: string) {
  return async ({
    currencyId,
    derivationMode,
    path,
    accountPath,
  }: DeriveRequest): Promise<DerivedKey> => {
    const currency = getCryptoCurrencyById(currencyId);

    if (currency.family === "bitcoin") {
      const xpubVersion = getNetworkParameters(currency.id).xpubVersion.readUInt32BE(0);
      const custom = getChainAdapter(currency.id).getWalletXpub?.(
        deviceId,
        { currency, accountPath, xpubVersion },
        signerContext,
      );
      const xpub =
        custom ??
        (await signerContext(deviceId, currency, signer =>
          signer.getWalletXpub({ path: accountPath, xpubVersion }),
        ));
      return { type: "utxo", xpub: await xpub };
    }

    const { address } = await firstValueFrom(
      withDevice(deviceId)(transport =>
        from(getAddress(transport, { currency, path, derivationMode })),
      ),
    );
    return { type: "address", address };
  };
}
