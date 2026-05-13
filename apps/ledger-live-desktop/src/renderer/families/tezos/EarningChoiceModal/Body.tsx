import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { useDispatch } from "LLD/hooks/redux";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Check from "~/renderer/icons/CheckFull";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

export type Data = {
  account: TezosAccount | TokenAccount;
  parentAccount?: TezosAccount | null;
  source?: string;
};

type Props = {
  onClose?: () => void;
  params: Data;
};

const MODAL_NAME = "MODAL_TEZOS_EARNING_CHOICE";

const OptionCard = styled(Box).attrs(() => ({
  flex: 1,
  p: 4,
  flow: 2,
}))`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
`;

const ColumnHeader = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 12,
  color: "neutral.c70",
  textAlign: "center",
}))`
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const BulletRow = styled(Box).attrs(p => ({
  horizontal: true,
  justifyContent: "flex-start",
  alignItems: "center",
  color: p.theme.colors.greenPill,
}))`
  margin-bottom: 6px;
  & > :first-child {
    margin-right: 8px;
  }
`;

const Bullet = ({ i18nKey }: { i18nKey: string }) => (
  <BulletRow>
    <Check size={16} />
    <Text
      ff="Inter|SemiBold"
      fontSize={13}
      color="neutral.c100"
      style={{ lineHeight: 1.57, flex: 1 }}
    >
      <Trans i18nKey={i18nKey} />
    </Text>
  </BulletRow>
);

const Body = ({ onClose, params }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const stakingUrl = useLocalizedUrl(urls.stakingTezos);
  const { account, parentAccount, source } = params;

  const onDelegate = useCallback(() => {
    dispatch(closeModal(MODAL_NAME));
    dispatch(openModal("MODAL_DELEGATE", { account, parentAccount, source }));
  }, [dispatch, account, parentAccount, source]);

  const onStake = useCallback(() => {
    dispatch(closeModal(MODAL_NAME));
    dispatch(openModal("MODAL_TEZOS_STAKE", { account, parentAccount, source }));
  }, [dispatch, account, parentAccount, source]);

  return (
    <ModalBody
      onClose={onClose}
      title={<Trans i18nKey="tezos.earnChoice.title" />}
      render={() => (
        <Box flow={4} mx={4}>
          <TrackPage
            category="Delegation Flow"
            name="Earning Choice"
            type="modal"
            flow="stake"
            action="delegation"
            currency="xtz"
          />
          <Text ff="Inter|SemiBold" fontSize={13} color="neutral.c80" style={{ lineHeight: 1.57 }}>
            <Trans i18nKey="tezos.earnChoice.description" />
          </Text>
          <Box alignItems="center" mb={4}>
            <LinkWithExternalIcon
              label={t("tezos.earnChoice.howItWorks")}
              onClick={() => openURL(stakingUrl)}
            />
          </Box>
          <Box horizontal flow={3} alignItems="stretch">
            <Box flex={1} flow={3} alignItems="stretch">
              <ColumnHeader>
                <Trans i18nKey="tezos.earnChoice.delegate.header" />
              </ColumnHeader>
              <OptionCard>
                <Bullet i18nKey="tezos.earnChoice.delegate.bullet.0" />
                <Bullet i18nKey="tezos.earnChoice.delegate.bullet.1" />
                <Bullet i18nKey="tezos.earnChoice.delegate.bullet.2" />
                <Bullet i18nKey="tezos.earnChoice.delegate.bullet.3" />
              </OptionCard>
              <Box alignItems="center">
                <Button
                  primary
                  data-testid="tezos-earn-choice-delegate-button"
                  onClick={onDelegate}
                >
                  <Trans i18nKey="tezos.earnChoice.delegate.cta" />
                </Button>
              </Box>
            </Box>
            <Box flex={1} flow={3} alignItems="stretch">
              <ColumnHeader>
                <Trans i18nKey="tezos.earnChoice.stake.header" />
              </ColumnHeader>
              <OptionCard>
                <Bullet i18nKey="tezos.earnChoice.stake.bullet.0" />
                <Bullet i18nKey="tezos.earnChoice.stake.bullet.1" />
                <Bullet i18nKey="tezos.earnChoice.stake.bullet.2" />
                <Bullet i18nKey="tezos.earnChoice.stake.bullet.3" />
              </OptionCard>
              <Box alignItems="center">
                {/* Pending LIVE-29536: enable once the Stake flow ships (https://ledgerhq.atlassian.net/browse/LIVE-29536). */}
                <Button
                  primary
                  disabled
                  data-testid="tezos-earn-choice-stake-button"
                  onClick={onStake}
                >
                  <Trans i18nKey="tezos.earnChoice.stake.cta" />
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    />
  );
};

export default Body;
