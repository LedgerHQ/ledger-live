import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { selectGamDismissedCampaignIds } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  clearGamDismissedContentCards,
  previewDevGenericAwarenessModalCard,
  removeDevGenericAwarenessModalCardFromStore,
  removeGamDismissedCampaignIds,
  replaceDevCardsInRedux,
  syncDevCardsToRedux,
} from "../../utils/applyDevCardsToStore";
import { buildContentCardFromForm } from "../../utils/buildContentCardFromForm";
import { campaignIdDeeplinkHint, resolveCampaignId } from "../../utils/campaignIds";
import {
  createDefaultCarouselSlideAt,
  createDefaultFeatureIntroItemAt,
  createDevFormListKeys,
  createInitialFormState,
  MAX_FEATURE_INTRO_ITEMS,
  MIN_CAROUSEL_SLIDES,
  MIN_FEATURE_INTRO_ITEMS,
} from "../../utils/defaults";
import {
  clearDevGenericAwarenessModalCards,
  getDevGenericAwarenessModalCards,
  removeDevGenericAwarenessModalCard,
  upsertDevGenericAwarenessModalCard,
} from "../../utils/devCardsStore";
import type {
  CarouselSlideForm,
  DevLayoutMode,
  DevTriggerMode,
  FeatureIntroItemForm,
  GenericAwarenessModalDevFormState,
} from "../../utils/types";

export const useGenericAwarenessModalDevScreenViewModel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState<GenericAwarenessModalDevFormState>(() =>
    createInitialFormState(),
  );
  const [slideKeys, setSlideKeys] = useState(() =>
    createDevFormListKeys(createInitialFormState().slides.length),
  );
  const [itemKeys, setItemKeys] = useState(() =>
    createDevFormListKeys(createInitialFormState().items.length),
  );
  const [savedCards, setSavedCards] = useState(getDevGenericAwarenessModalCards);
  const gamDismissedIds = useSelector(selectGamDismissedCampaignIds);
  const hasGamDismissedIds = gamDismissedIds.length > 0;

  const campaignId = useMemo(
    () => resolveCampaignId(form.layout, form.trigger),
    [form.layout, form.trigger],
  );

  const deeplink = useMemo(() => campaignIdDeeplinkHint(campaignId), [campaignId]);

  const refreshSavedCards = useCallback(() => {
    setSavedCards(getDevGenericAwarenessModalCards());
  }, []);

  const applyFormState = useCallback((nextForm: GenericAwarenessModalDevFormState) => {
    setForm(nextForm);
    setSlideKeys(createDevFormListKeys(nextForm.slides.length));
    setItemKeys(createDevFormListKeys(nextForm.items.length));
  }, []);

  const onBack = useCallback(() => {
    navigate("/settings/developer");
  }, [navigate]);

  const setLayout = useCallback(
    (layout: DevLayoutMode) => {
      applyFormState(createInitialFormState(layout, form.trigger));
    },
    [applyFormState, form.trigger],
  );

  const setTrigger = useCallback(
    (trigger: DevTriggerMode) => {
      applyFormState(createInitialFormState(form.layout, trigger));
    },
    [applyFormState, form.layout],
  );

  const updateForm = useCallback((patch: Partial<GenericAwarenessModalDevFormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const updateSlide = useCallback((index: number, patch: Partial<CarouselSlideForm>) => {
    setForm(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    }));
  }, []);

  const addSlide = useCallback(() => {
    setForm(prev => ({
      ...prev,
      slides: [...prev.slides, createDefaultCarouselSlideAt(prev.slides.length)],
    }));
    setSlideKeys(prev => [...prev, crypto.randomUUID()]);
  }, []);

  const removeSlide = useCallback((index: number) => {
    setForm(prev => {
      if (prev.slides.length <= MIN_CAROUSEL_SLIDES) return prev;
      return { ...prev, slides: prev.slides.filter((_, i) => i !== index) };
    });
    setSlideKeys(prev =>
      prev.length <= MIN_CAROUSEL_SLIDES ? prev : prev.filter((_, i) => i !== index),
    );
  }, []);

  const updateItem = useCallback((index: number, patch: Partial<FeatureIntroItemForm>) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }, []);

  const addItem = useCallback(() => {
    setForm(prev => {
      if (prev.items.length >= MAX_FEATURE_INTRO_ITEMS) return prev;
      return {
        ...prev,
        items: [...prev.items, createDefaultFeatureIntroItemAt(prev.items.length)],
      };
    });
    setItemKeys(prev =>
      prev.length >= MAX_FEATURE_INTRO_ITEMS ? prev : [...prev, crypto.randomUUID()],
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setForm(prev => {
      if (prev.items.length <= MIN_FEATURE_INTRO_ITEMS) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
    setItemKeys(prev =>
      prev.length <= MIN_FEATURE_INTRO_ITEMS ? prev : prev.filter((_, i) => i !== index),
    );
  }, []);

  const onAddToStore = useCallback(() => {
    const card = buildContentCardFromForm(form);
    upsertDevGenericAwarenessModalCard(card);
    dispatch(syncDevCardsToRedux({ excludeAppStart: true }));
    refreshSavedCards();
  }, [dispatch, form, refreshSavedCards]);

  const onPreview = useCallback(() => {
    const card = buildContentCardFromForm(form);
    upsertDevGenericAwarenessModalCard(card);
    refreshSavedCards();
    dispatch(previewDevGenericAwarenessModalCard(card.id));
  }, [dispatch, form, refreshSavedCards]);

  const onRemoveAll = useCallback(() => {
    const removedIds = getDevGenericAwarenessModalCards().map(card => card.id);
    clearDevGenericAwarenessModalCards();
    dispatch(removeGamDismissedCampaignIds(removedIds));
    dispatch(replaceDevCardsInRedux([]));
    refreshSavedCards();
  }, [dispatch, refreshSavedCards]);

  const onRemoveSavedCard = useCallback(
    (id: string) => {
      removeDevGenericAwarenessModalCard(id);
      dispatch(removeDevGenericAwarenessModalCardFromStore(id));
      refreshSavedCards();
    },
    [dispatch, refreshSavedCards],
  );

  const onResetFormDefaults = useCallback(() => {
    applyFormState(createInitialFormState(form.layout, form.trigger));
  }, [applyFormState, form.layout, form.trigger]);

  const onClearGamDismissed = useCallback(() => {
    dispatch(clearGamDismissedContentCards());
  }, [dispatch]);

  return {
    form,
    campaignId,
    deeplink,
    savedCards,
    gamDismissedIds,
    hasGamDismissedIds,
    slideKeys,
    itemKeys,
    onBack,
    setLayout,
    setTrigger,
    updateForm,
    updateSlide,
    addSlide,
    removeSlide,
    updateItem,
    addItem,
    removeItem,
    onAddToStore,
    onPreview,
    onRemoveAll,
    onRemoveSavedCard,
    onResetFormDefaults,
    onClearGamDismissed,
  };
};

export type GenericAwarenessModalDevScreenViewModel = ReturnType<
  typeof useGenericAwarenessModalDevScreenViewModel
>;
