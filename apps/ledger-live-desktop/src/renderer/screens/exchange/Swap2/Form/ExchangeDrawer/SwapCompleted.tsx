import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Icon, Link } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import FakeLink from "~/renderer/components/FakeLink";
import Text from "~/renderer/components/Text";
import { GradientHover } from "~/renderer/drawers/OperationDetails/styledComponents";
import IconCheck from "~/renderer/icons/Check";
import IconClock from "~/renderer/icons/Clock";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import {
  getSwapProvider,
  AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import { IconWrapper, WrapperClock } from "../../../shared/shared-styles";

const Pill = styled(Text)`
  user-select: text;
  border-radius: 4px;
  background: ${p => p.theme.colors.palette.text.shade10};
  padding: 3px 6px;
`;
const SwapIdWrapper = styled(Box).attrs(p => ({
  ff: "Inter",
  color: p.color || "palette.text.shade80",
  fontSize: 4,
  relative: true,
}))`
  padding-top: 24px;

  ${GradientHover} {
    display: none;
  }

  &:hover ${GradientHover} {
    display: flex;
    & > * {
      cursor: pointer;
    }
  }

  &:hover ${Pill} {
    color: ${p => p.theme.colors.palette.text.shade100};
  }
}
`;

const SwapCompleted = ({
  swapId,
  provider,
  targetCurrency,
}: {
  swapId: string;
  provider: string;
  targetCurrency: string;
}) => {
  const [providerData, setproviderData] = useState<AdditionalProviderConfig>();

  useEffect(() => {
    const getProvideData = async () => {
      const data = await getSwapProvider(provider);
      setproviderData(data);
    };
    getProvideData();
  }, [provider]);

  const openProviderSupport = useCallback(() => {
    openURL(providerData!.supportUrl);
  }, [providerData]);

  const openFeedbackFormTrack = () => {
    track("button_clicked", {
      page: "ModalStep-finished",
      flow: "swap",
      button: "FeedbackForm",
    });
    openURL("https://ledger.typeform.com/to/FIHc3fk2");
  };

  const SwapPill = ({ swapId }: { swapId: string }) => (
    <SwapIdWrapper>
      <Pill color="palette.text.shade100" ff="Inter|SemiBold" fontSize={4} data-testid="swap-id">
        #{swapId}
      </Pill>
      <GradientHover>
        <CopyWithFeedback text={swapId} />
      </GradientHover>
    </SwapIdWrapper>
  );

  return (
    <Box alignItems="center">
      <IconWrapper>
        <IconCheck size={20} />
        <WrapperClock>
          <IconClock size={16} />
        </WrapperClock>
      </IconWrapper>
      <Text
        mt={4}
        color="palette.text.shade100"
        data-testid={"swap-completed-message"}
        ff="Inter|SemiBold"
        fontSize={5}
      >
        <Trans i18nKey={`swap2.exchangeDrawer.completed.title`} />
      </Text>
      <Text
        mt={13}
        textAlign="center"
        color="palette.text.shade50"
        data-testid={"swap-completed-description"}
        ff="Inter|Regular"
        fontSize={4}
      >
        <Trans
          i18nKey={`swap2.exchangeDrawer.completed.description`}
          values={{
            targetCurrency,
          }}
        />
      </Text>
      <SwapPill swapId={swapId} />
      <Link
        mt={4}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="share-your-feedback-link"
        size="medium"
        type="shade"
        color="palette.text.shade100"
        Icon={() => <Icon name="ExternalLink" />}
        alwaysUnderline
        onClick={openFeedbackFormTrack}
      >
        <Trans i18nKey={`swap2.exchangeDrawer.completed.tellAboutYourExperience`} />
      </Link>

      <Alert type="help" mt={6}>
        <Trans
          i18nKey={`swap2.exchangeDrawer.completed.disclaimer`}
          values={{
            provider: getProviderName(provider),
          }}
        >
          <FakeLink onClick={openProviderSupport}>
            <span
              style={{
                marginRight: 4,
              }}
            >
              {getProviderName(provider)}
            </span>
          </FakeLink>
        </Trans>
      </Alert>
    </Box>
  );
};

export default SwapCompleted;
