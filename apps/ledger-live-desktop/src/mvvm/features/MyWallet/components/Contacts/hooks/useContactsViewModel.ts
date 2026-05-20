import { useTranslation } from "react-i18next";

export type ContactsViewModel = {
  title: string;
  description: string;
  handleClick: () => void;
};

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();

  // TODO(contacts-L4): wire to the designer-led Contacts management surface
  // (a new subtree under mvvm/features/Contacts/<new-surface>/). Inert for
  // now so the row holds its place in the user-menu popover without
  // navigating anywhere.
  const handleClick = () => {};

  return {
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    handleClick,
  };
}
