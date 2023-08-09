import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import { rgba } from "~/renderer/styles/helpers";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px 20px;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: ${p => rgba(p.theme.colors.palette.secondary.main, 0.02)};
  > * {
    width: 30%;
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }
`;

const Header = () => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <Text ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
        {t("cardano.delegation.pool")}
      </Text>
      <Text ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
        {t("delegation.amount")}
      </Text>
      <Text ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
        {t("delegation.rewards")}
      </Text>
      <Text />
    </Wrapper>
  );
};

export default Header;
