import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ExternalLink, Question } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { ReceiveAddressViewProps } from "../../../types";

type MemoTagPanelProps = Pick<ReceiveAddressViewProps, "onBackToAddress" | "onLearnMoreMemoTag"> & {
  memoTag: NonNullable<ReceiveAddressViewProps["memoTag"]>;
};

/** The `info` preset tints the dialog when it sits in a `DialogBackgroundToneProvider`. */
export function MemoTagPanel({ memoTag, onBackToAddress, onLearnMoreMemoTag }: MemoTagPanelProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={memoTag.title}
      description={memoTag.description}
      primaryCta={{ label: memoTag.gotItLabel, onPress: onBackToAddress }}
      secondaryCta={{
        label: memoTag.learnMoreLabel,
        icon: ExternalLink,
        onPress: onLearnMoreMemoTag,
      }}
      testID="receive-address-memo-panel"
    />
  );
}

type HelpPanelProps = Pick<ReceiveAddressViewProps, "help" | "onOpenHelpArticle">;

export function HelpPanel({ help, onOpenHelpArticle }: HelpPanelProps) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="receive-address-help-panel">
      {help.articles.map(article => (
        <ListItem
          key={article.id}
          onClick={() => onOpenHelpArticle(article.id)}
          data-testid={`receive-address-help-${article.id}`}
        >
          <ListItemLeading>
            <Spot icon={Question} size={40} />
            <ListItemContent>
              <ListItemTitle>{article.label}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </div>
  );
}
