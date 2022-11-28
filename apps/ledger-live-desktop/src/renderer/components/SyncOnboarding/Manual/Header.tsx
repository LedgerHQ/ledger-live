import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import styled from "styled-components";

import LangSwitcher from "../../Onboarding/LangSwitcher";
import { rgba } from "~/renderer/styles/helpers";

// TODO: remove this when the lang switcher is properly reworked
const LangSwitcherButtonLikeWrapper = styled(Flex)`
  padding-top: 2px;
  border-radius: 9999px;
  :hover {
    box-shadow: 0 0 0 2px ${p => rgba(p.theme.colors.primary.c60, 0.4)};
  }
`;

export type Props = {
  onClose: () => void;
  onHelp: () => void;
};

const Header = ({ onClose, onHelp }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex zIndex={200} px={8} py={8} justifyContent="flex-end">
      <LangSwitcherButtonLikeWrapper>
        <LangSwitcher />
      </LangSwitcherButtonLikeWrapper>
      <Button ml={4} onClick={onHelp} data-test-id="manual-help-button">
        {t("syncOnboarding.manual.header.helpButton")}
      </Button>
      <Button ml={12} variant="neutral" onClick={onClose} Icon={CloseMedium} />
    </Flex>
  );
};

export default Header;
