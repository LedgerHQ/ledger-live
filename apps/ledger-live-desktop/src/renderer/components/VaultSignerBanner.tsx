import React from "react";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";

import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import { vaultSignerSelector } from "~/renderer/reducers/settings";
import TopBanner from "~/renderer/components/TopBanner";
import { openURL } from "~/renderer/linking";
import ExternalLink from "./ExternalLink";

const VaultSignerBanner = () => {
  const { t } = useTranslation();
  const { enabled } = useSelector(vaultSignerSelector);
  if (!enabled) return null;
  return (
    <TopBanner
      id={"vault-signer-banner"}
      content={{
        Icon: ExclamationCircleThin,
        message: <Trans i18nKey="banners.vaultSigner.title" />,
        right: (
          <ExternalLink
            isInternal={false}
            onClick={() => openURL("https://help.vault.ledger.com")}
            label={t("banners.vaultSigner.link")}
          />
        ),
      }}
      status={"warning"}
    />
  );
};

export default VaultSignerBanner;
