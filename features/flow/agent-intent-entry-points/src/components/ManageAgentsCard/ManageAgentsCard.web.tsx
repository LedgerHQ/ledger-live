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
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Robot } from "@ledgerhq/lumen-ui-react/symbols";
import type { ManageAgentsCardProps } from "./ManageAgentsCard.types";

export function ManageAgentsCard({ onOpen, testID = "manage-agents-card" }: ManageAgentsCardProps) {
  const { t } = useTranslation();

  return (
    <Card type="interactive" onClick={onOpen} data-testid={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Robot} />
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
            data-testid={`${testID}-new-badge`}
          />
          <ChevronRight size={24} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
