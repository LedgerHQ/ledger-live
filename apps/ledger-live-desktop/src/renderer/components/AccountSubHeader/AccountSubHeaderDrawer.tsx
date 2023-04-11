import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
type Props = {
  isOpen: boolean;
  closeDrawer: () => void;
  family: string;
  team: string;
};
const Title = styled(Text)`
  font-style: normal;
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
`;
const Description = styled(Text)`
  font-size: 13px;
`;
export function AccountSubHeaderDrawer({ isOpen, closeDrawer, family, team }: Props) {
  const { t } = useTranslation();
  return (
    <SideDrawer
      title={t("account.subHeader.drawer.title", {
        family,
      })}
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
    >
      <Box px={40} py={40}>
        <Title>
          {t("account.subHeader.drawer.subTitle", {
            family,
            team,
          })}
        </Title>
        <Box py={3}>
          <Description>{t("account.subHeader.drawer.description")}</Description>
        </Box>
        <Box py={2}>
          <Description>{t("account.subHeader.drawer.description2")}</Description>
        </Box>
        <Box py={2}>
          <Description>
            {t("account.subHeader.drawer.description3", {
              team,
            })}
          </Description>
        </Box>
      </Box>
    </SideDrawer>
  );
}
export default AccountSubHeaderDrawer;
