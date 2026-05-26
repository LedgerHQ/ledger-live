import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { closeGenericAwarenessModalDialog } from "../genericAwarenessModalDialog";
import { openURL } from "~/renderer/linking";

export interface GenericAwarenessModalPromptViewModel {
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  imageUrl?: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

const useGenericAwarenessModalPromptViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
): GenericAwarenessModalPromptViewModel => {
  const dispatch = useDispatch();

  const prompt: GenericAwarenessModalPrompt | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.Prompt ? contentCard : undefined;

  const onPrimaryClick = useCallback(() => {
    if (prompt) {
      openURL(prompt.primaryButtonLink);
      dispatch(closeGenericAwarenessModalDialog());
    }
  }, [dispatch, prompt]);

  const onSecondaryClick = useCallback(() => {
    if (prompt) {
      openURL(prompt.secondaryButtonLink);
      dispatch(closeGenericAwarenessModalDialog());
    }
  }, [dispatch, prompt]);

  return useMemo(
    () => ({
      title: prompt?.title ?? "",
      subtitle: prompt?.subtitle ?? "",
      primaryButtonLabel: prompt?.primaryButtonLabel ?? "",
      secondaryButtonLabel: prompt?.secondaryButtonLabel ?? "",
      imageUrl: prompt?.imageUrl || undefined,
      onPrimaryClick,
      onSecondaryClick,
    }),
    [onPrimaryClick, onSecondaryClick, prompt],
  );
};

export default useGenericAwarenessModalPromptViewModel;
