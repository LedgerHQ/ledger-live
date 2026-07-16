import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { isPrivateDestination } from "@ledgerhq/live-common/families/aleo/utils";
import { useTranslation } from "~/context/Locale";

type BadgeProps = Readonly<{ transaction: Transaction }>;

export function SummaryToBadge({ transaction }: BadgeProps) {
  const { t } = useTranslation();

  if (transaction.family !== "aleo") {
    return null;
  }

  const key = isPrivateDestination(transaction)
    ? "aleo.operations.type.private"
    : "aleo.operations.type.public";

  return <Tag appearance="gray" size="sm" label={t(key)} />;
}
