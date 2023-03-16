// @flow
import React from "react";

import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
// eslint-disable-next-line prettier/prettier
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import Box from "~/renderer/components/Box";
import ExclamationCircle from "~/renderer/icons/ExclamationCircle.jsx";

const Container: ThemedComponent<{}> = styled(Box).attrs(props => ({
  horizontal: true,
  flex: 1,
  fontSize: props.small ? 3 : 4,
}))`
  border-radius: 4px;
  align-items: center;
  margin-bottom: 20px;

  ${p => {
    return css`
      padding: 16px 16px;
      color: ${p.theme.colors.dark};
      background-color: ${p.theme.colors.grey};
      border: none;
      border-xolor: transparent;
    `;
  }}

  ${p =>
    p.small &&
    css`
      padding: 8px;
    `}
`;

const TitleContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  flex: 1,
  ml: 4
}))`
  word-break: break-word;
`;

const Content = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  flex: 1,
}))`
  word-break: break-word;
`

export default function Alert() {
  const { t } = useTranslation();

  return (
      <Container type={"warning"} >
        <ExclamationCircle size={16} />
        <Content>
          <TitleContent>{t("vechain.warning")}</TitleContent>
        </Content>
      </Container>
    
  );
}
