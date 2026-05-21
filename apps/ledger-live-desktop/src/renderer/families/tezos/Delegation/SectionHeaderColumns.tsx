import React from "react";
import { Trans } from "react-i18next";
import Text from "~/renderer/components/Text";

const COLUMN_I18N_KEYS = [
  "delegation.validator",
  "delegation.amount",
  "delegation.value",
] as const;

type Props = {
  trailingI18nKey?: string;
};

const HeaderText = ({ i18nKey }: { i18nKey: string }) => (
  <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
    <Trans i18nKey={i18nKey} />
  </Text>
);

const SectionHeaderColumns = ({ trailingI18nKey }: Props) => (
  <>
    {COLUMN_I18N_KEYS.map(key => (
      <HeaderText key={key} i18nKey={key} />
    ))}
    {trailingI18nKey ? <HeaderText i18nKey={trailingI18nKey} /> : <Text />}
  </>
);

export default SectionHeaderColumns;
