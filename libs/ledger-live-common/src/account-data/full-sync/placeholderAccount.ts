import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountContext } from "@domain/entity-account-context";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  emptyHistoryCache,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { fromDescriptorPath } from "@domain/entity-derivation";
import {
  UnsupportedAddressFromKeyError,
  addressFromKey,
  toLegacyAccount,
} from "../../account/accountDescriptor";
import { shouldUseGenericCoinFrameworkBridge } from "../../bridge/impl";
import { usesMockBridges } from "../../bridge/mockMode";
import { readDerivedLegacyHints } from "../discovery/derivedLegacyHints";

/** An account the store does not hold, from its descriptor and its context (the mock scan's own in mock mode). */
export async function placeholderAccount(
  descriptor: AccountDescriptor,
  context?: AccountContext,
): Promise<Account> {
  const { currencyId, derivationMode, index, xpub, freshAddress, publicKey, customData } =
    toLegacyAccount(descriptor, context);
  const currency = getCryptoCurrencyById(currencyId);
  // A public-key family's sync reads its key from the account id (TON, ICP, Aptos, Stacks).
  const xpubOrAddress = xpub ?? publicKey ?? freshAddress ?? "";
  const mock = usesMockBridges();
  if (mock) {
    const { findScannedMockAccount } = await import("../../bridge/mockHelpers");
    const scanned = await findScannedMockAccount(currency, xpubOrAddress);
    if (scanned) return scanned;
  }
  const genericBridge = shouldUseGenericCoinFrameworkBridge(currency.family);
  const hints = readDerivedLegacyHints(descriptor);
  let unsupportedAddressFromKey = false;
  const address = publicKey
    ? await addressFromKey(currencyId, publicKey).catch((error: unknown) => {
        if (error instanceof UnsupportedAddressFromKeyError) {
          unsupportedAddressFromKey = true;
          return hints?.address ?? freshAddress ?? "";
        }
        throw error;
      })
    : (freshAddress ?? "");
  const resolvedXpub = xpub ?? (genericBridge ? hints?.publicKey || undefined : undefined);
  const account: Account = {
    type: "Account",
    id: encodeAccountId({
      type: mock ? "mock" : "js",
      version: "2",
      currencyId,
      xpubOrAddress,
      derivationMode,
      customData,
    }),
    seedIdentifier: hints?.seedIdentifier ?? xpubOrAddress,
    derivationMode,
    index,
    xpub: resolvedXpub,
    freshAddress: address,
    freshAddressPath: descriptor.type === "address" ? fromDescriptorPath(descriptor.path) : "",
    used: false,
    currency,
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
  if (unsupportedAddressFromKey && publicKey) {
    if (currency.family === "concordium") {
      return {
        ...account,
        xpub: publicKey,
        concordiumResources: {
          isOnboarded: false,
          credId: "",
          publicKey,
          identityIndex: 0,
          credNumber: 0,
          ipIdentity: 0,
        },
      } as Account;
    }
    if (currency.family === "canton") {
      let isOnboarded = false;
      let partyXpub: string | undefined;
      try {
        const [{ isAccountOnboarded }, { pinConfig }, { buildContext }] = await Promise.all([
          import("@ledgerhq/coin-canton/bridge/onboard"),
          import("@ledgerhq/coin-canton/config"),
          import("../../bridge/generic-coin-framework/api/context"),
        ]);
        const cantonContext =
          buildContext<import("@ledgerhq/coin-canton/config").CantonCoinConfig>("canton_network");
        const config = await cantonContext.config(currencyId);
        const result = await isAccountOnboarded(pinConfig(cantonContext, config), publicKey);
        isOnboarded = result.isOnboarded;
        partyXpub = result.isOnboarded && result.partyId ? result.partyId : undefined;
      } catch {
        // Leave onboarding lookup empty when currency config is unavailable (e.g. isolated unit tests).
      }
      return {
        ...account,
        xpub: partyXpub ?? account.xpub,
        cantonResources: {
          isOnboarded,
          publicKey,
          xpub: partyXpub ?? "",
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as Account;
    }
  }
  return account;
}
