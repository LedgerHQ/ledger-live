// @flow

import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import * as S from "./AccountSubHeaderDrawer.styles";

type Props = {
  isOpen: boolean,
  closeDrawer: () => void,
};

const AccountSubHeaderDrawer = ({ isOpen, closeDrawer }: Props) => {
  const { t } = useTranslation();
  return (
    <SideDrawer
      title={t("avalanchepchain.account.subHeader.drawerTitle")}
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
    >
      <Box px={40} py={40}>
        <S.Title>{t("avalanchepchain.account.subHeader.title")}</S.Title>
        <Box py={3}>
          <S.Description>{t("avalanchepchain.account.subHeader.description")}</S.Description>
        </Box>
        <S.Divider mt={2} />
        <Box mt={3}>
          <LinkWithExternalIcon
            label={<Trans i18nKey="avalanchepchain.account.subHeader.website" />}
            onClick={() => openURL(urls.figment.website)}
          />
        </Box>
      </Box>
    </SideDrawer>
  );
};

export default AccountSubHeaderDrawer;