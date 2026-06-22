import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";
import {
  closeGenericAwarenessModalDialog,
  type CloseGenericAwarenessModalDialogOptions,
} from "../genericAwarenessModalDialog";
import { openURL } from "~/renderer/linking";
import {
  getPromptAnalyticsContext,
  trackPromptCloseClick,
  trackPromptDismissed,
  trackPromptPage,
  trackPromptPrimaryClick,
  trackPromptSecondaryClick,
} from "../analytics/promptAnalytics";

export interface GenericAwarenessModalPromptViewModel {
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  imageUrlLight?: string;
  imageUrlDark?: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  onHeaderClose: () => void;
  onDismiss: () => void;
}

const useGenericAwarenessModalPromptViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalPromptViewModel => {
  const dispatch = useDispatch();
  const hasTrackedOpenRef = useRef(false);

  const prompt: GenericAwarenessModalPrompt | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.Prompt ? contentCard : undefined;

  const closeDialog = useCallback(
    (options?: CloseGenericAwarenessModalDialogOptions) => {
      dispatch(closeGenericAwarenessModalDialog(options));
    },
    [dispatch],
  );

  const getContext = useCallback(() => {
    if (!prompt) {
      return undefined;
    }
    return getPromptAnalyticsContext(prompt);
  }, [prompt]);

  useEffect(() => {
    if (!isOpen || !prompt) {
      hasTrackedOpenRef.current = false;
      return;
    }

    if (hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;
    trackPromptPage(prompt);
  }, [isOpen, prompt]);

  const onPrimaryClick = useCallback(() => {
    const context = getContext();
    if (context && prompt) {
      trackPromptPrimaryClick(context, prompt.primaryButtonLabel, prompt.primaryButtonLink);
      openURL(prompt.primaryButtonLink);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext, prompt]);

  const onSecondaryClick = useCallback(() => {
    const context = getContext();
    if (context && prompt) {
      trackPromptSecondaryClick(context, prompt.secondaryButtonLabel, prompt.secondaryButtonLink);
      openURL(prompt.secondaryButtonLink);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext, prompt]);

  const onHeaderClose = useCallback(() => {
    const context = getContext();
    if (context) {
      trackPromptCloseClick(context);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext]);

  const onDismiss = useCallback(() => {
    const context = getContext();
    if (context) {
      trackPromptDismissed(context);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext]);

  return useMemo(
    () => ({
      title: prompt?.title ?? "",
      subtitle: prompt?.subtitle ?? "",
      primaryButtonLabel: prompt?.primaryButtonLabel ?? "",
      primaryButtonLink: prompt?.primaryButtonLink ?? "",
      secondaryButtonLabel: prompt?.secondaryButtonLabel ?? "",
      secondaryButtonLink: prompt?.secondaryButtonLink ?? "",
      imageUrlLight: prompt?.imageUrlLight,
      imageUrlDark: prompt?.imageUrlDark,
      onPrimaryClick,
      onSecondaryClick,
      onHeaderClose,
      onDismiss,
    }),
    [onDismiss, onHeaderClose, onPrimaryClick, onSecondaryClick, prompt],
  );
};

export default useGenericAwarenessModalPromptViewModel;
