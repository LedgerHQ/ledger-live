import React from "react";
import { Trans } from "react-i18next";
import Text from "~/renderer/components/Text";

type Props = {
  withTransactionId?: boolean;
  trailingI18nKey?: string;
};

const HeaderText = ({ i18nKey }: { i18nKey: string }) => (
  <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
    <Trans i18nKey={i18nKey} />
  </Text>
);

const SectionHeaderColumns = ({ withTransactionId, trailingI18nKey }: Props) => (
  <>
    <HeaderText i18nKey="delegation.validator" />
    {withTransactionId ? <HeaderText i18nKey="delegation.transactionID" /> : null}
    <HeaderText i18nKey="delegation.amount" />
    <HeaderText i18nKey="delegation.value" />
    {trailingI18nKey ? <HeaderText i18nKey={trailingI18nKey} /> : <Text />}
  </>
);

export default SectionHeaderColumns;
