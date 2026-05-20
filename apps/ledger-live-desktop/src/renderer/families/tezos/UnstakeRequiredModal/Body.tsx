import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

export type UnstakeRequiredReason = "changeBaker" | "endDelegation";
export type Data = { reason: UnstakeRequiredReason };

export const MODAL_NAME = "MODAL_TEZOS_UNSTAKE_REQUIRED";
const STEP_KEYS = [0, 1, 2, 3] as const;

const StepBadge = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 13,
  color: "neutral.c100",
  bg: "neutral.c30",
  alignItems: "center",
  justifyContent: "center",
}))`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  flex-shrink: 0;
`;

type Props = { onClose?: () => void; params: Data };

const Body = ({ onClose, params }: Props) => {
  const { t } = useTranslation();
  const stakingUrl = useLocalizedUrl(urls.stakingTezos);
  const { reason } = params;

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <ModalBody
      onClose={handleClose}
      title={<Trans i18nKey={`tezos.unstakeRequired.${reason}.title`} />}
      render={() => (
        <Box flow={4} mx={4}>
          <TrackPage
            category="Delegation Flow"
            name="Unstake Required"
            type="modal"
            flow="stake"
            action="delegation"
            reason={reason}
            currency="xtz"
          />
          <Text ff="Inter|Medium" fontSize={13} color="neutral.c80" style={{ lineHeight: 1.57 }}>
            <Trans i18nKey={`tezos.unstakeRequired.${reason}.description`} />
          </Text>
          <Box flow={3}>
            {STEP_KEYS.map(i => (
              <Box key={i} horizontal alignItems="center" flow={3}>
                <StepBadge aria-hidden="true">{i + 1}</StepBadge>
                <Text
                  ff="Inter|SemiBold"
                  fontSize={13}
                  color="neutral.c100"
                  style={{ lineHeight: 1.57, flex: 1 }}
                >
                  <Trans i18nKey={`tezos.unstakeRequired.steps.${i}`} />
                </Text>
              </Box>
            ))}
          </Box>
          <Box alignItems="flex-start">
            <LinkWithExternalIcon
              label={t("tezos.unstakeRequired.learnMore")}
              onClick={() => openURL(stakingUrl)}
            />
          </Box>
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal justifyContent="flex-end">
          <Button primary data-testid="tezos-unstake-required-close-button" onClick={handleClose}>
            <Trans i18nKey="tezos.unstakeRequired.close" />
          </Button>
        </Box>
      )}
    />
  );
};

export default Body;
