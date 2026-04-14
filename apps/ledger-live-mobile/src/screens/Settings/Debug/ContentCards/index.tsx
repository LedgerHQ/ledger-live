import React, { useCallback, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { Alert, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "~/context/hooks";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import SettingsRow from "~/components/SettingsRow";
import {
  addLocalContentCards,
  appendLocalContentCards,
  addLocalWalletCarouselCards,
  clearLocalContentCards,
} from "~/actions/dynamicContent";
import {
  buildSampleBanner,
  buildSampleActionCarouselInitial,
  buildSampleActionCarouselAppendCard,
  buildSampleWalletCarouselPicto,
  buildSampleWalletCarouselTag,
  type SampleActionBannerVariant,
} from "~/dynamicContent/buildLocalContentCards";
import { localCategoriesCardsSelector } from "~/reducers/dynamicContent";

type ActionCarouselSession = {
  categoryId: string;
  nextIndex: number;
};

export default function DebugContentCards() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const localCategories = useSelector(localCategoriesCardsSelector);

  /** Single shared top_wallet action carousel: icon + image_background taps append to the same row. */
  const actionCarouselSessionRef = useRef<ActionCarouselSession | null>(null);

  const onAddSampleBanner = useCallback(() => {
    const { category, cards } = buildSampleBanner();
    dispatch(addLocalContentCards({ category, cards }));
  }, [dispatch]);

  const handleSampleActionCarouselPress = useCallback(
    (variant: SampleActionBannerVariant) => {
      let session = actionCarouselSessionRef.current;
      const sessionCategoryId = session?.categoryId;
      const categoryStillExists =
        sessionCategoryId != null && localCategories.some(c => c.categoryId === sessionCategoryId);

      if (!categoryStillExists) {
        actionCarouselSessionRef.current = null;
        session = null;
      }

      if (session == null) {
        const { category, cards } = buildSampleActionCarouselInitial(variant);
        dispatch(addLocalContentCards({ category, cards }));
        const categoryId = category.categoryId ?? category.id;
        actionCarouselSessionRef.current = { categoryId, nextIndex: 1 };
        return;
      }

      const card = buildSampleActionCarouselAppendCard(
        session.categoryId,
        variant,
        session.nextIndex,
      );
      dispatch(appendLocalContentCards([card]));
      actionCarouselSessionRef.current = {
        categoryId: session.categoryId,
        nextIndex: session.nextIndex + 1,
      };
    },
    [dispatch, localCategories],
  );

  const onAddSampleActionCarouselIcon = useCallback(() => {
    handleSampleActionCarouselPress("icon");
  }, [handleSampleActionCarouselPress]);

  const onAddSampleActionCarouselImageBackground = useCallback(() => {
    handleSampleActionCarouselPress("imageBackground");
  }, [handleSampleActionCarouselPress]);

  const onAddSampleWalletCarouselPicto = useCallback(() => {
    dispatch(addLocalWalletCarouselCards(buildSampleWalletCarouselPicto()));
  }, [dispatch]);

  const onAddSampleWalletCarouselTag = useCallback(() => {
    dispatch(addLocalWalletCarouselCards(buildSampleWalletCarouselTag()));
  }, [dispatch]);

  const onDismissAll = useCallback(() => {
    actionCarouselSessionRef.current = null;
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
        title={t("settings.debug.contentCards.addSampleWalletCarouselPicto")}
        desc={t("settings.debug.contentCards.addSampleWalletCarouselPictoDesc")}
        iconLeft={<IconsLegacy.WalletMedium size={24} color="black" />}
        onPress={onAddSampleWalletCarouselPicto}
      />
      <SettingsRow
        title={t("settings.debug.contentCards.addSampleWalletCarouselTag")}
        desc={t("settings.debug.contentCards.addSampleWalletCarouselTagDesc")}
        iconLeft={<IconsLegacy.WalletMedium size={24} color="black" />}
        onPress={onAddSampleWalletCarouselTag}
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
