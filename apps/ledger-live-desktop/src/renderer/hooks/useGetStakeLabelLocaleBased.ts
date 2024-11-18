import { useTranslation } from "react-i18next";
import { getSystemLocale } from "~/helpers/systemLocale";

export const useGetStakeLabelLocaleBased = () => {
  const locale = getSystemLocale();
  const { t } = useTranslation();
  return locale === "en-GB" ? t("accounts.contextMenu.yield") : t("accounts.contextMenu.earn");
};
