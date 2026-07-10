import { AccountLike } from "@ledgerhq/types-live";
import { AppManifest } from "../../types";
import { DappNetwork } from "./types";

export type DappSwitchEthereumChainContext = {
  manifest: AppManifest;
  setCurrentAccount: (account: AccountLike) => void;
  setCurrentAccountHist: (id: string, account: AccountLike) => void;
};

/**
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3326.md
 *
 * Prompts the user to pick an account on the requested chain (via
 * `requestAccount`) and updates the current account + history. Resolves once an
 * account is selected, rejects when the user cancels.
 */
export function dappSwitchEthereumChainLogic(
  { manifest, setCurrentAccount, setCurrentAccountHist }: DappSwitchEthereumChainContext,
  requestedCurrency: DappNetwork,
  requestAccount: (params: {
    currencyIds: string[];
    areCurrenciesFiltered: boolean;
    onSuccess: (account: AccountLike) => void;
    onCancel: () => void;
  }) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    requestAccount({
      currencyIds: [requestedCurrency.currency],
      areCurrenciesFiltered: true,
      onSuccess: account => {
        setCurrentAccountHist(manifest.id, account);
        setCurrentAccount(account);
        resolve();
      },
      onCancel: () => {
        reject("User canceled");
      },
    }),
  );
}
