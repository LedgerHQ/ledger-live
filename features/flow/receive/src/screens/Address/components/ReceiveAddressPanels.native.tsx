import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink, Question } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ReceiveAddressViewProps } from "../../../types";

type MemoTagSheetProps = Pick<
  ReceiveAddressViewProps,
  "memoTag" | "onBackToAddress" | "onLearnMoreMemoTag"
> &
  Readonly<{ isOpen: boolean }>;

/** The `info` preset tints the enclosing bottom sheet with the muted gradient. */
export function MemoTagSheet({
  isOpen,
  memoTag,
  onBackToAddress,
  onLearnMoreMemoTag,
}: MemoTagSheetProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen && !!memoTag}
      onClose={onBackToAddress}
      enableDynamicSizing
      testID="receive-address-memo-sheet"
    >
      {memoTag ? (
        <BottomSheetView>
          <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", paddingBottom: "s16" }}>
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
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}

type HelpSheetProps = Pick<
  ReceiveAddressViewProps,
  "help" | "onOpenHelpArticle" | "onBackToAddress"
> &
  Readonly<{ isOpen: boolean }>;

export function HelpSheet({ isOpen, help, onOpenHelpArticle, onBackToAddress }: HelpSheetProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onBackToAddress}
      enableDynamicSizing
      testID="receive-address-help-sheet"
    >
      <BottomSheetView>
        <BottomSheetHeader density="expanded" title={help.title} />
        <Box
          lx={{ marginHorizontal: "-s8", paddingBottom: "s16" }}
          testID="receive-address-help-panel"
        >
          {help.articles.map(article => (
            <ListItem
              key={article.id}
              density="expanded"
              onPress={() => onOpenHelpArticle(article.id)}
              testID={`receive-address-help-${article.id}`}
            >
              <ListItemLeading>
                <Spot icon={Question} size={48} />
                <ListItemContent>
                  <ListItemTitle>{article.label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
            </ListItem>
          ))}
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
