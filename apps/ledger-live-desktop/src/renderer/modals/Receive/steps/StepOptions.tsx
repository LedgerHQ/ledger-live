import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Icons } from "@ledgerhq/react-ui/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { StepProps } from "../Body";
import { useHistory } from "react-router";
import { rgba } from "~/renderer/styles/helpers";
import Text from "~/renderer/components/Text";

const Option = styled(Box)`
  background-color: ${p => rgba(p.theme.colors.palette.secondary.main, 0.05)};
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 8px;
  margin-top: 8px;
  &:hover {
    box-shadow: 0px 0px 0px 4px ${p => rgba(p.theme.colors.primary.c70, 0.25)};
    border: 1px solid ${p => p.theme.colors.primary.c70};
    text-decoration: none;
  }
`;

const IconWrapper = styled(Box)`
  align-items: center;
  background-color: ${p => rgba(p.theme.colors.palette.secondary.main, 0.05)};
  border: 1px ${p => rgba(p.theme.colors.palette.secondary.main, 0.1)} solid;
  border-radius: 100%;
  display: flex;
  height: 40px;
  width: 40px;
  justify-content: center;
  margin: 10px;
  flex-shrink: 0;
`;

const Content = styled(Box)`
  flex: 1;
  text-align: left;
`;

export default function StepOptions(props: Readonly<StepProps>) {
  const { eventType, transitionTo, closeModal } = props;
  const history = useHistory();

  function handleGoToBankProvider() {
    closeModal();
    history.push({
      pathname: "/bank",
    });
  }

  return (
    <Box>
      <TrackPage category={`Receive Flow${eventType ? ` (${eventType})` : ""}`} name="Step 1" />
      <Option onClick={handleGoToBankProvider}>
        <IconWrapper>
          <Icons.Bank size={"M"} />
        </IconWrapper>
        <Content>
          <Text color="palette.text.shade100" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey="receive.steps.options.fromBank.title" />
          </Text>
          <Text color="palette.text.shade60" ff="Inter|Regular" fontSize={3}>
            <Trans i18nKey="receive.steps.options.fromBank.description" />
          </Text>
        </Content>
      </Option>
      <Option onClick={() => transitionTo("account")}>
        <IconWrapper>
          <Icons.CoinsCrypto size={"M"} />
        </IconWrapper>
        <Content>
          <Text color="palette.text.shade100" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey="receive.steps.options.fromCrypto.title" />
          </Text>
          <Text color="palette.text.shade60" ff="Inter|Regular" fontSize={3}>
            <Trans i18nKey="receive.steps.options.fromCrypto.description" />
          </Text>
        </Content>
      </Option>
    </Box>
  );
}
