import type { AccountLike } from "@ledgerhq/types-live";
import { validateNameEdition } from "@ledgerhq/live-wallet/accountName";
import { setAccountName as actionSetAccountName } from "@ledgerhq/live-wallet/store";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccount } from "~/renderer/actions/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useContacts } from "~/renderer/contacts/useContacts";

export type EditNameViewProps = {
  initialValue: string;
  /** Local rename (redux) — applied AFTER the device flow succeeds. */
  onConfirm: (value: string) => void;
  /**
   * Build the device verb that renames the Ledger account on device. When the
   * account was already registered through Contacts (we hold its
   * `hmacProofHex`), this drives the on-device EDIT flow
   * (`editLedgerAccount`), which is seed-bound: a device holding a different
   * seed is rejected with `SW 0x6982`. Otherwise it's a first-time
   * registration (`registerLedgerAccount`). The dialog hands the returned
   * closure to `RunDeviceAction.run`, so renaming requires confirming on the
   * device.
   *
   * Returns `null` when the verb can't be built (token rows, non-EVM
   * currencies, or an account without a derivation path) — the dialog
   * then falls back to the local-only rename.
   */
  makeDeviceVerb: (newName: string) => ((deviceId: string) => Promise<unknown>) | null;
};

export const useEditNameViewModel = ({
  account,
}: {
  account: AccountLike;
}): EditNameViewProps => {
  const dispatch = useDispatch();
  const contacts = useContacts();
  const accountName = useMaybeAccountName(account);

  const initialValue = accountName ?? "";

  const onConfirm = (value: string) => {
    const name = validateNameEdition(account, value);
    if (account.type === "Account") {
      dispatch(updateAccount(account));
    }
    dispatch(actionSetAccountName(account.id, name));
  };

  const makeDeviceVerb = (newName: string) => {
    // Only main accounts carry their own derivation path; the DMK
    // register/edit verbs are EVM-only (keyed by chainId).
    if (account.type !== "Account") return null;
    const chainId = account.currency.ethereumLikeInfo?.chainId;
    if (typeof chainId !== "number") return null;
    const derivationPath = account.freshAddressPath;
    if (!derivationPath) return null;
    // Already registered through Contacts? Use the seed-bound EDIT flow so a
    // wrong-seed device is rejected (SW 0x6982). The match is by chain +
    // path/address — the same coordinates the registration was stored under.
    const existing = contacts.findLedgerAccount({
      chainId,
      derivationPath,
      addressHex: account.freshAddress,
    });
    if (existing) {
      return (deviceId: string) =>
        contacts.editLedgerAccount(deviceId, {
          name: newName,
          oldName: existing.name,
          derivationPath,
          chainId,
          hmacProofHex: existing.hmacProofHex,
        });
    }
    // First-time naming: nothing to seed-bind yet — register fresh.
    return (deviceId: string) =>
      contacts.addLedgerAccount(deviceId, {
        name: newName,
        derivationPath,
        chainId,
      });
  };

  return { initialValue, onConfirm, makeDeviceVerb };
};
