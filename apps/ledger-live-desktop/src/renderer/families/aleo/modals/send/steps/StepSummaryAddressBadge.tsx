import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { getAleoAddressBadgeI18nKey } from "../../../shared/utils";

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  background-color: ${p => p.theme.colors.neutral.c20};
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: ${p => p.theme.colors.neutral.c70};
  letter-spacing: 0.05em;
  line-height: 1;
  text-transform: uppercase;
  margin-top: 1px;
`;

type Props = {
  transaction: Transaction;
  direction: "from" | "to";
};

const StepSummaryAddressBadge = ({ transaction, direction }: Props) => {
  const { t } = useTranslation();
  const i18nKey = getAleoAddressBadgeI18nKey(transaction, direction);

  return <Label>{t(i18nKey)}</Label>;
};

export default StepSummaryAddressBadge;
