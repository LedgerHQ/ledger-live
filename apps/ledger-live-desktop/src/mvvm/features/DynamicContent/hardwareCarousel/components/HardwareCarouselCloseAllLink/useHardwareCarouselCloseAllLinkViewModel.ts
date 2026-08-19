import { useTranslation } from "react-i18next";

import { useHardwareCarouselCloseAll } from "../../useHardwareCarouselCloseAll";

type UseHardwareCarouselCloseAllLinkViewModelArgs = Readonly<{
  cardIds: readonly string[];
}>;

export function useHardwareCarouselCloseAllLinkViewModel({
  cardIds,
}: UseHardwareCarouselCloseAllLinkViewModelArgs) {
  const { t } = useTranslation();
  const handleCloseAll = useHardwareCarouselCloseAll(cardIds);

  return {
    handleCloseAll,
    label: t("portfolio.carousel.closeAll"),
  };
}
