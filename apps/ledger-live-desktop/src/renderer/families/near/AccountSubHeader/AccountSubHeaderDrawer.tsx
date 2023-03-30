import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
type Props = {
  isOpen: boolean;
  closeDrawer: () => void;
};
const AccountSubHeaderDrawer = ({ isOpen, closeDrawer }: Props) => {
  const { t } = useTranslation();
  return (
    <SideDrawer
      title={t("near.account.subHeader.drawerTitle")}
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
    >
      <Box px={40} py={40}>
        <Title>{t("near.account.subHeader.title")}</Title>
        <Box py={3}>
          <Description>{t("near.account.subHeader.description")}</Description>
        </Box>
        <Box py={2}>
          <Description>{t("near.account.subHeader.description2")}</Description>
        </Box>
        <Divider mt={2} />
        <Box mt={3}>
          <LinkWithExternalIcon
            label={<Trans i18nKey="near.account.subHeader.website" />}
            onClick={() => openURL(urls.figment.website)}
          />
        </Box>
      </Box>
    </SideDrawer>
  );
};
export const Title: ThemedComponent<{}> = styled(Text)`
  font-style: normal;
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
`;
export const Divider: ThemedComponent<{}> = styled(Box)`
  border: 1px solid #f5f5f5;
`;
export const Description: ThemedComponent<{}> = styled(Text)`
  font-size: 13px;
`;
export default AccountSubHeaderDrawer;
