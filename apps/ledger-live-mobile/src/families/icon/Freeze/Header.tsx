import React from "react";
import { Trans, useTranslation } from "react-i18next";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import Link from "../../../components/wrappedUi/Link";

type Props = {
  count: number;
  onPress: () => void;
};

export default function Header({ count, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <AccountSectionLabel
      name={t("icon.voting.header", { total: count })}
      RightComponent={
        <Link type="color" event="IconManageVotes" onPress={onPress}>
          <Trans i18nKey="icon.voting.manageVotes" />
        </Link>
      }
    />
  );
}
