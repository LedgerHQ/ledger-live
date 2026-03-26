import React, { useCallback } from "react";
import { useTranslation } from "~/context/Locale";
import { Alert, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch } from "~/context/hooks";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import SettingsRow from "~/components/SettingsRow";
import { addLocalContentCards, clearLocalContentCards } from "~/actions/dynamicContent";
import {
  buildSampleBanner,
  buildSampleActionCarousel,
} from "~/dynamicContent/buildLocalContentCards";

export default function DebugContentCards() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onAddSampleBanner = useCallback(() => {
    const { category, cards } = buildSampleBanner();
    dispatch(addLocalContentCards({ category, cards }));
  }, [dispatch]);

  const onAddSampleActionCarouselIcon = useCallback(() => {
    const { category, cards } = buildSampleActionCarousel("icon");
    dispatch(addLocalContentCards({ category, cards }));
  }, [dispatch]);

  const onAddSampleActionCarouselImageBackground = useCallback(() => {
    const { category, cards } = buildSampleActionCarousel("imageBackground");
    dispatch(addLocalContentCards({ category, cards }));
  }, [dispatch]);

  const onDismissAll = useCallback(() => {
    dispatch(clearLocalContentCards());
  }, [dispatch]);

  return (
    <SettingsNavigationScrollView>
      <Flex p={6} pt={0}>
        <Alert type="info" title={t("settings.debug.contentCards.description")} />
      </Flex>
      <SettingsRow
        hasBorderTop
        title={t("settings.debug.contentCards.addSampleBanner")}
        desc={t("settings.debug.contentCards.addSampleBannerDesc")}
        iconLeft={<IconsLegacy.GraphGrowMedium size={24} color="black" />}
        onPress={onAddSampleBanner}
      />
      <SettingsRow
        title={t("settings.debug.contentCards.addSampleActionCarouselIcon")}
        desc={t("settings.debug.contentCards.addSampleActionCarouselIconDesc")}
        iconLeft={<IconsLegacy.BoxMedium size={24} color="black" />}
        onPress={onAddSampleActionCarouselIcon}
      />
      <SettingsRow
        title={t("settings.debug.contentCards.addSampleActionCarouselImageBackground")}
        desc={t("settings.debug.contentCards.addSampleActionCarouselImageBackgroundDesc")}
        iconLeft={<IconsLegacy.LayersMedium size={24} color="black" />}
        onPress={onAddSampleActionCarouselImageBackground}
      />
      <SettingsRow
        title={t("settings.debug.contentCards.dismissAll")}
        desc={t("settings.debug.contentCards.dismissAllDesc")}
        iconLeft={<IconsLegacy.TrashMedium size={24} color="black" />}
        onPress={onDismissAll}
      />
    </SettingsNavigationScrollView>
  );
}
