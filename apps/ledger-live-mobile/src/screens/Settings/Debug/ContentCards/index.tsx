import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { Banner, Box } from "@ledgerhq/lumen-ui-rnative";
import { Information, Screens, Trash, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
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
import {
  buildDefaultGenericAwarenessModalFormValues,
  buildLocalGenericAwarenessModalContentCards,
  getDefaultGenericAwarenessModalCampaignId,
  type GenericAwarenessModalDebugFormValues,
  type GenericAwarenessModalDebugItem,
  type GenericAwarenessModalDebugLayout,
  type GenericAwarenessModalDebugTrigger,
} from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import { localCategoriesCardsSelector } from "~/reducers/dynamicContent";
import {
  appendGenericAwarenessModalContentCards,
  clearLocalGenericAwarenessModalContentCards,
  closeGenericAwarenessModalDrawer,
  openGenericAwarenessModalDrawer,
  selectGenericAwarenessModalContentCards,
} from "~/reducers/genericAwarenessModal";
import { GenericAwarenessModalFormSheet } from "./GenericAwarenessModalFormSheet";
import { GenericAwarenessModalsSection } from "./GenericAwarenessModalsSection";

type ActionCarouselSession = {
  categoryId: string;
  nextIndex: number;
};

const FEATURE_INTRO_MAX_ITEMS = 3;

const buildDefaultItem = (index: number): GenericAwarenessModalDebugItem => ({
  title: `Step ${index + 1}`,
  subtitle: "Describe this step for QA.",
  imageUrl:
    "https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80",
  primaryButtonLabel: "Continue",
  primaryButtonLink: "ledgerlive://earn",
  icon: "Info",
});

export default function DebugContentCards() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const localCategories = useSelector(localCategoriesCardsSelector);
  const genericAwarenessModalContentCards = useSelector(selectGenericAwarenessModalContentCards);
  const [genericAwarenessForm, setGenericAwarenessForm] =
    useState<GenericAwarenessModalDebugFormValues>(buildDefaultGenericAwarenessModalFormValues);
  const [isGenericAwarenessFormOpen, setIsGenericAwarenessFormOpen] = useState(false);

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

  const updateGenericAwarenessForm = useCallback(
    <Key extends keyof GenericAwarenessModalDebugFormValues>(
      key: Key,
      value: GenericAwarenessModalDebugFormValues[Key],
    ) => {
      setGenericAwarenessForm(current => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const updateGenericAwarenessTrigger = useCallback(
    (trigger: GenericAwarenessModalDebugTrigger) => {
      setGenericAwarenessForm(current => ({
        ...current,
        trigger,
        campaignId: getDefaultGenericAwarenessModalCampaignId(current.layout, trigger),
      }));
    },
    [],
  );

  const updateGenericAwarenessItem = useCallback(
    (index: number, values: Partial<GenericAwarenessModalDebugItem>) => {
      setGenericAwarenessForm(current => ({
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...values } : item,
        ),
      }));
    },
    [],
  );

  const addGenericAwarenessItem = useCallback(() => {
    setGenericAwarenessForm(current => ({
      ...current,
      items: [...current.items, buildDefaultItem(current.items.length)],
    }));
  }, []);

  const removeGenericAwarenessItem = useCallback((index: number) => {
    setGenericAwarenessForm(current => {
      if (current.items.length <= 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }, []);

  const openGenericAwarenessModal = useCallback(
    (campaignId: string) => {
      dispatch(openGenericAwarenessModalDrawer({ campaignId }));
    },
    [dispatch],
  );

  const onCreateGenericAwarenessModal = useCallback(() => {
    const nextCards = buildLocalGenericAwarenessModalContentCards(genericAwarenessForm);
    dispatch(appendGenericAwarenessModalContentCards(nextCards));
    setIsGenericAwarenessFormOpen(false);
  }, [dispatch, genericAwarenessForm]);

  const onClearGenericAwarenessModals = useCallback(() => {
    dispatch(clearLocalGenericAwarenessModalContentCards());
    dispatch(closeGenericAwarenessModalDrawer());
  }, [dispatch]);

  const openGenericAwarenessForm = useCallback((layout: GenericAwarenessModalDebugLayout) => {
    setGenericAwarenessForm(current => ({
      ...current,
      layout,
      campaignId: getDefaultGenericAwarenessModalCampaignId(layout, current.trigger),
      items:
        layout === GenericAwarenessModalLayout.FeatureIntro
          ? current.items.slice(0, FEATURE_INTRO_MAX_ITEMS)
          : current.items,
    }));
    setIsGenericAwarenessFormOpen(true);
  }, []);

  const closeGenericAwarenessForm = useCallback(() => {
    setIsGenericAwarenessFormOpen(false);
  }, []);

  return (
    <>
      <SettingsNavigationScrollView>
        <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s24" }}>
          <Banner title={t("settings.debug.contentCards.description")} />
        </Box>
        <SettingsRow
          hasBorderTop
          title={t("settings.debug.contentCards.addSampleBanner")}
          desc={t("settings.debug.contentCards.addSampleBannerDesc")}
          iconLeft={<Information size={24} color="base" />}
          onPress={onAddSampleBanner}
        />
        <SettingsRow
          title={t("settings.debug.contentCards.addSampleActionCarouselIcon")}
          desc={t("settings.debug.contentCards.addSampleActionCarouselIconDesc")}
          iconLeft={<Screens size={24} color="base" />}
          onPress={onAddSampleActionCarouselIcon}
        />
        <SettingsRow
          title={t("settings.debug.contentCards.addSampleActionCarouselImageBackground")}
          desc={t("settings.debug.contentCards.addSampleActionCarouselImageBackgroundDesc")}
          iconLeft={<Screens size={24} color="base" />}
          onPress={onAddSampleActionCarouselImageBackground}
        />
        <SettingsRow
          title={t("settings.debug.contentCards.addSampleWalletCarouselPicto")}
          desc={t("settings.debug.contentCards.addSampleWalletCarouselPictoDesc")}
          iconLeft={<Wallet size={24} color="base" />}
          onPress={onAddSampleWalletCarouselPicto}
        />
        <SettingsRow
          title={t("settings.debug.contentCards.addSampleWalletCarouselTag")}
          desc={t("settings.debug.contentCards.addSampleWalletCarouselTagDesc")}
          iconLeft={<Wallet size={24} color="base" />}
          onPress={onAddSampleWalletCarouselTag}
        />
        <SettingsRow
          title={t("settings.debug.contentCards.dismissAll")}
          desc={t("settings.debug.contentCards.dismissAllDesc")}
          iconLeft={<Trash size={24} color="base" />}
          onPress={onDismissAll}
        />
        <GenericAwarenessModalsSection
          cards={genericAwarenessModalContentCards}
          onOpenModal={openGenericAwarenessModal}
          onClearLocalCards={onClearGenericAwarenessModals}
          onCreateCarousel={() => openGenericAwarenessForm(GenericAwarenessModalLayout.Carousel)}
          onCreateFeatureIntro={() =>
            openGenericAwarenessForm(GenericAwarenessModalLayout.FeatureIntro)
          }
          onCreatePrompt={() => openGenericAwarenessForm(GenericAwarenessModalLayout.Prompt)}
        />
      </SettingsNavigationScrollView>
      <GenericAwarenessModalFormSheet
        form={genericAwarenessForm}
        isOpen={isGenericAwarenessFormOpen}
        maxFeatureIntroItems={FEATURE_INTRO_MAX_ITEMS}
        onClose={closeGenericAwarenessForm}
        onCreate={onCreateGenericAwarenessModal}
        onChangeField={updateGenericAwarenessForm}
        onChangeTrigger={updateGenericAwarenessTrigger}
        onAddItem={addGenericAwarenessItem}
        onRemoveItem={removeGenericAwarenessItem}
        onChangeItem={updateGenericAwarenessItem}
      />
    </>
  );
}
