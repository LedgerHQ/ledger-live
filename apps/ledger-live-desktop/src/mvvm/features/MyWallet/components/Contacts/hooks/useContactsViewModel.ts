import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useContextMenuClose } from "../../ContextMenuContext";

export type ContactsViewModel = {
  title: string;
  description: string;
  handleClick: () => void;
};

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const close = useContextMenuClose();

  const handleClick = () => {
    navigate("/contacts");
    close();
  };

  return {
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    handleClick,
  };
}
