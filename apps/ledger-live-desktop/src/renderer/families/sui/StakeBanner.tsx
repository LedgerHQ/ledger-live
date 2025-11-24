import React from "react";
import { Trans } from "react-i18next";
import { Button, Text } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import TopBanner from "~/renderer/components/TopBanner";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import { useSuiStakingBanners } from "@ledgerhq/live-common/families/sui/react";
import { canStake } from "@ledgerhq/live-common/families/sui/logic";
import { openModal } from "~/renderer/actions/modals";
import { radii } from "~/renderer/styles/theme";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import StyleProvider from "~/renderer/styles/StyleProvider";

const ClickableText = styled(Text)`
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const SuiStakeBanner: React.FC<{ account: SuiAccount }> = ({ account }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { showBoostBanner, showIncentiveBanner } = useSuiStakingBanners(account.freshAddress);

  const handleStakeClick = () => {
    if (!canStake(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_SUI_DELEGATE", {
          account,
        }),
      );
    }
  };

  const handleHowItWorksClick = () => {
    openURL("https://www.ledger.com/sui-staking-boost");
  };

  if (!showBoostBanner && !showIncentiveBanner) {
    return null;
  }

  return (
    <Box>
      {showBoostBanner && (
        <Box mb={4}>
          <StyleProvider selectedPalette="dark">
            <TopBanner
              testId="sui-stake-boost-banner"
              containerStyle={{
                background: `linear-gradient(to left, ${colors.primary.c70}, ${colors.primary.c60})`,
                borderRadius: radii[2],
                padding: "12px 16px",
              }}
              content={{
                message: (
                  <Box shrink>
                    <Text fontFamily="Inter|Bold" fontSize={5} color="neutral.c100">
                      Sui x Ledger Stake boost
                    </Text>
                    <Text color="neutral.c90">
                      Stake Sui with Ledger validator and get 60% boosted rewards during 60 days
                    </Text>
                  </Box>
                ),
                right: (
                  <Box horizontal alignItems="center" style={{ gap: "16px" }}>
                    <ClickableText
                      color="neutral.c100"
                      fontSize={4}
                      fontWeight="medium"
                      pl={2}
                      onClick={handleHowItWorksClick}
                    >
                      How it works
                    </ClickableText>
                    <Button variant="main" onClick={handleStakeClick}>
                      <Trans i18nKey="Stake with Ledger" />
                    </Button>
                  </Box>
                ),
              }}
            />
          </StyleProvider>
        </Box>
      )}

      {showIncentiveBanner && (
        <AccountBanner
          title="Sui x Ledger incentives"
          description="Your stake is eligible to the staking incentive programs. Extra rewards will be distributed at the end of the staking period"
          cta="Stake with Ledger"
          onClick={handleStakeClick}
          display={true}
          linkText="Learn more"
          linkUrl="https://www.ledger.com/sui-incentives"
        />
      )}
    </Box>
  );
};

export default SuiStakeBanner;
