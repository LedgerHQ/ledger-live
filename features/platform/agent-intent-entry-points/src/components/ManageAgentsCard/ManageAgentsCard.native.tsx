import React from "react";
import { useTranslation } from "@shared/i18n";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import { Robot } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ManageAgentsCardProps } from "./ManageAgentsCard.types";

export function ManageAgentsCard({ onOpen, testID = "manage-agents-card" }: ManageAgentsCardProps) {
  const { t } = useTranslation();

  return (
    <Card type="interactive" onPress={onOpen} testID={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Robot} size={48} />
          <CardContent>
            <CardContentTitle>{t("agentIntent.manageAgents.title")}</CardContentTitle>
            <CardContentDescription>
              {t("agentIntent.manageAgents.description")}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Tag
            label={t("common.new")}
            appearance="accent"
            size="md"
            testID={`${testID}-new-badge`}
          />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
