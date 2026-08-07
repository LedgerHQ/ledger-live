import { BigNumber } from "bignumber.js";
import {
  runDerivationScheme,
  getDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  decodeAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "./schema";

/**
 * Restores the essential fields of an Account from a wallet sync descriptor.
 * Everything else (balance, operations) is a placeholder that the first sync is
 * expected to fill in.
 */
export const descriptorToAccount = ({
  id,
  currencyId,
  freshAddress: inputFreshAddress,
  index,
  derivationMode: derivationModeStr,
  seedIdentifier,
}: AccountDescriptor): Account => {
  const { xpubOrAddress } = decodeAccountId(id); // TODO rename in AccountId xpubOrAddress

  const derivationMode = asDerivationMode(derivationModeStr);
  const currency = getCryptoCurrencyById(currencyId);
  let xpub = "";
  let freshAddress = inputFreshAddress || "";
  let freshAddressPath = "";

  if (
    // FIXME Dirty hack, since we have no way here to know if "xpubOrAddress" is one or the other.
    // Proposed fix: https://ledgerhq.atlassian.net/browse/LL-7437
    currency.family === "bitcoin" ||
    currency.family === "cardano"
  ) {
    // In bitcoin implementation, xpubOrAddress field always go in the xpub
    xpub = xpubOrAddress;
  } else {
    if (currency.family === "stacks") {
      xpub = xpubOrAddress;
    } else if (!freshAddress) {
      // otherwise, it's the freshAddress
      freshAddress = xpubOrAddress;
    }

    freshAddressPath = runDerivationScheme(
      getDerivationScheme({
        currency,
        derivationMode,
      }),
      currency,
      {
        account: index,
      },
    );
  }

  return {
    type: "Account",
    id,
    derivationMode,
    seedIdentifier,
    xpub,
    used: false,
    currency,
    index,
    freshAddress,
    freshAddressPath,
    swapHistory: [],
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };
};
