import React from "react";
import { Trans, useTranslation } from "react-i18next";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Link from "~/components/wrappedUi/Link";

type Props = {
  count: number;
  onPress: () => void;
};

export default function Header({ count }: Props) {
  const { t } = useTranslation();
  return (
    <AccountSectionLabel
      name={t("tron.voting.header", { total: count })}
      RightComponent={
        <Link type="color" event="TronManageVotes" disabled={true}>
          <Trans i18nKey="tron.voting.manageVotes" />
        </Link>
      }
    />
  );
}
