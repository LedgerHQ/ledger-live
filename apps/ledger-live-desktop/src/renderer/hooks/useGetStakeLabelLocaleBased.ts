import { useTranslation } from "react-i18next";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export const useGetStakeLabelLocaleBased = () => {
  const { region } = getParsedSystemDeviceLocale();
  const { t } = useTranslation();

  return region === "GB" ? t("accounts.contextMenu.yield") : t("accounts.contextMenu.earn");
};
