import React from "react";
import { Trans } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { TFunction } from "i18next";

// "no associated accounts" text when adding/importing accounts
const NoAssociatedAccounts = ({ t }: { t: TFunction }) => {
  const createAccountSupportUrl = useLocalizedUrl(urls.hedera.supportArticleLink);

  return (
    <div>
      <Trans i18nKey="hedera.createHederaAccountHelp.text"></Trans>{" "}
      <LinkWithExternalIcon
        fontSize={3}
        onClick={() => openURL(createAccountSupportUrl)}
        label={t("hedera.createHederaAccountHelp.link")}
      />
    </div>
  );
};
export default NoAssociatedAccounts;
