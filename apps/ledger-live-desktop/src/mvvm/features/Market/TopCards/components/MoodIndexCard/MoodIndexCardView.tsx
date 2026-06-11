import React from "react";
import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";
import { getFearAndGreedTranslationKey } from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { FearAndGreedIndicator } from "LLD/features/FearAndGreed/components/FearAndGreedIndicator";
import { FearAndGreedDialog } from "LLD/features/FearAndGreed/components/FearAndGreedDialog";

type MoodIndexCardViewProps = {
  data: FearAndGreedIndex;
  onClick: () => void;
};

export const MoodIndexCardView = ({ data, onClick }: MoodIndexCardViewProps) => {
  const { t } = useTranslation();

  const translationKey = getFearAndGreedTranslationKey(data.value);

  return (
    <FearAndGreedDialog>
      <Card type="interactive" onClick={onClick} data-testid="mood-index-card">
        <CardHeader>
          <CardLeading>
            <CardContent>
              <CardContentTitle>
                <span className="body-3">{t("market.topCards.moodIndex.title")}</span>
              </CardContentTitle>
              <CardContentDescription>
                <span className="body-1-semi-bold text-base">{t(translationKey)}</span>
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <FearAndGreedIndicator value={data.value} />
          </CardTrailing>
        </CardHeader>
      </Card>
    </FearAndGreedDialog>
  );
};
