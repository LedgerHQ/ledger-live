import React, { useContext } from "react";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { vaultSignerSelector } from "~/renderer/reducers/settings";
import TopBanner from "~/renderer/components/TopBanner";

const VaultSignerBanner = () => {
  const { enabled } = useSelector(vaultSignerSelector);
  if (!enabled) return null;
  return (
    <TopBanner
      id={"vault-signer-banner"}
      content={{
        Icon: ExclamationCircleThin,
        message: <Trans i18nKey="banners.vaultSigner.title" />,
      }}
      status={"warning"}
    />
  );
};

export default VaultSignerBanner;
