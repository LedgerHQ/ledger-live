import React from "react";
import type { Operation } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import Section from "~/screens/OperationDetails/Section";

type Props = {
  operation: Operation;
};

function readMemo(extra: unknown): string | undefined {
  if (typeof extra !== "object" || extra === null || !("memo" in extra)) return undefined;
  const { memo } = extra;
  return typeof memo === "string" && memo ? memo : undefined;
}

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  const memo = readMemo(operation.extra);

  if (!memo) return null;

  return <Section title={t("operationDetails.extra.memo")} value={memo} />;
}

export default {
  OperationDetailsExtra,
};
