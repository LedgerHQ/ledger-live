import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import type { PostOnboardingActionViewProps } from "./types";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { CheckmarkCircleFill, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

/** Lumen symbol pixel size in the list (no `Spot` wrapper, so no muted round background). */
const INCOMPLETE_LUMEN_ICON_PX = 24;

const PostOnboardingActionView = memo(function PostOnboardingActionView({
  completed,
  description,
  lumenSymbol,
  onRowActivate,
  postOnboardingActionId,
  testId,
  title,
}: PostOnboardingActionViewProps) {
  const { t } = useTranslation();
  const LumenIcon = lumenSymbol;

  return (
    <ListItem
      data-testid={testId}
      data-post-onboarding-action-id={postOnboardingActionId}
      onClick={completed ? undefined : onRowActivate}
      className={completed ? "p-8 m-0 rounded-md" : "cursor-pointer p-8 m-0 rounded-md"}
    >
      <ListItemLeading className="gap-0">
        {completed ? (
          <div className="flex pr-12 shrink-0 items-center justify-center">
            <CheckmarkCircleFill size={24} className="text-success" />
          </div>
        ) : (
          <div className="flex pr-12 shrink-0 items-center justify-center text-base">
            <LumenIcon size={INCOMPLETE_LUMEN_ICON_PX} />
          </div>
        )}
        <ListItemContent>
          <ListItemTitle>{t(title)}</ListItemTitle>
          <ListItemDescription>
            {completed ? t("postOnboarding.dialog.actionCompletedLabel") : t(description)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {completed ? null : <ChevronRight size={24} className="text-muted" />}
      </ListItemTrailing>
    </ListItem>
  );
});

export default PostOnboardingActionView;
