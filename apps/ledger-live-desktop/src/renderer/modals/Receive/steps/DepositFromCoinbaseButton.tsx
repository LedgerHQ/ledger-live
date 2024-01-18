import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Text } from "@ledgerhq/react-ui";
import { CexDepositEntryPointsLocationsDesktop } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import styled from "styled-components";
import { closeModal } from "~/renderer/actions/modals";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import ChevronRight from "~/renderer/icons/ChevronRight";
import CoinbaseIcon from "~/renderer/icons/Coinbase";

const TitleText = styled(Text).attrs(() => ({
  variant: "body",
  fontSize: 16,
  fontWeight: "medium",
}))`
  transition: color ease-in-out 200ms;
`;

const EntryButtonContainer = styled.button`
  cursor: pointer;
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  border: none;
  background-color: ${p => p.theme.colors.palette.opacityDefault.c05};
  color: ${p => p.theme.colors.neutral.c100};
  border-radius: 4px;
  padding: ${p => p.theme.space[3]}px;
  gap: ${p => p.theme.space[3]}px;
  transition: ease-in-out 200ms;
  margin-top: ${p => p.theme.space[3]}px;

  &:focus {
    box-shadow: ${focusedShadowStyle};
  }

  &:focus:not(:focus-visible) {
    outline: 0;
    box-shadow: none;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  margin-right: ${p => p.theme.space[3]}px;
  background-color: ${p => p.theme.colors.palette.opacityDefault.c05};
`;

type Props = {
  location: CexDepositEntryPointsLocationsDesktop;
  source: string;
};

export const DepositFromCoinbaseButton = ({ location, source }: Props) => {
  const { t } = useTranslation();
  const cexDepositEntryPoints = useFeature("cexDepositEntryPointsDesktop");

  const history = useHistory();
  const dispatch = useDispatch();

  const onPressDepositFromCex = () => {
    const path = cexDepositEntryPoints?.params?.path;

    if (path) {
      history.push(path);
      dispatch(closeModal("MODAL_RECEIVE"));
      track("button_clicked2", {
        button: "deposit from coinbase",
        page: source,
      });
    }
  };

  if (
    !cexDepositEntryPoints?.enabled ||
    !cexDepositEntryPoints?.params?.locations?.[location] ||
    !cexDepositEntryPoints?.params?.path
  ) {
    return null;
  }

  return (
    <EntryButtonContainer onClick={onPressDepositFromCex}>
      <Box horizontal shrink alignItems="center">
        <IconWrapper>
          <CoinbaseIcon />
        </IconWrapper>
        <Box shrink alignItems="flex-start">
          <TitleText>{t("receive.steps.chooseAccount.depositFromCexBannerTitle")}</TitleText>
        </Box>
      </Box>
      {<ChevronRight size={11} />}
    </EntryButtonContainer>
  );
};
