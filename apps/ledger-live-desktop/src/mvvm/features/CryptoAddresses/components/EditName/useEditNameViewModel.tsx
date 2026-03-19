import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { validateNameEdition } from "@ledgerhq/live-wallet/accountName";
import { setAccountName as actionSetAccountName } from "@ledgerhq/live-wallet/store";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccount } from "~/renderer/actions/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

export type EditNameViewProps = {
  suggestions: string[];
  initialValue: string;
  onConfirm: (value: string) => void;
};

export const useEditNameViewModel = ({
  account,
  asset,
}: {
  account: Account;
  asset: string;
}): EditNameViewProps => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accountName = useMaybeAccountName(account);

  const suggestions = [
    t("cryptoAddresses.editName.suggestions.trading", { asset }),
    t("cryptoAddresses.editName.suggestions.savings", { asset }),
  ];

  const initialValue = accountName ?? "";

  const onConfirm = (value: string) => {
    const name = validateNameEdition(account, value);
    dispatch(updateAccount(account));
    dispatch(actionSetAccountName(account.id, name));
  };

  return { suggestions, initialValue, onConfirm };
};
