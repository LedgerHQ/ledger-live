import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Check from "../icons/CheckFull";
import TrackPage from "../analytics/TrackPage";
import { closeModal } from "~/renderer/actions/modals";
import Rewards from "../images/rewards.svg";
import Text from "./Text";
import Button from "./Button";
import Box from "./Box";
import Modal, { ModalBody } from "./Modal";
import { useDispatch } from "react-redux";
import { ModalData } from "../modals/types";

type Props<Name extends keyof ModalData> = {
  name: Name;
  onNext: () => void;
  nextLabel?: React.ReactNode;
  description: string;
  bullets: string[];
  additional: React.ReactNode;
  footerLeft?: React.ReactNode;
  currency: string;
};

export default function EarnRewardsInfoModal<Name extends keyof ModalData>({
  name,
  onNext,
  nextLabel,
  description,
  bullets,
  additional,
  footerLeft,
  currency,
}: Props<Name>) {
  const dispatch = useDispatch();
  const onNextFn = useCallback(() => {
    dispatch(closeModal(name));
    if (onNext) onNext();
  }, [dispatch, name, onNext]);
  return (
    <Modal
      name={name}
      centered
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="delegation.earnRewards" />}
          onClose={onClose}
          render={() => (
            <Box flow={4} mx={4}>
              <TrackPage
                category="Delegation Flow"
                name="Step Starter"
                type="modal"
                flow="stake"
                action="delegation"
                page="Earn Rewards Info"
                currency={currency}
              />
              <Box flow={1} alignItems="center">
                <Box mb={4}>
                  <RewardImg />
                </Box>
                <Box mb={4}>
                  <Text
                    ff="Inter|SemiBold"
                    fontSize={13}
                    textAlign="center"
                    color="palette.text.shade80"
                    style={{
                      lineHeight: 1.57,
                    }}
                  >
                    {description}
                  </Text>
                </Box>
                <Box>
                  {bullets.map((val, i) => (
                    <Row key={val + i}>
                      <Check size={16} />
                      <Text
                        ff="Inter|SemiBold"
                        style={{
                          lineHeight: 1.57,
                          flex: 1,
                        }}
                        color="palette.text.shade100"
                        fontSize={13}
                      >
                        {val}
                      </Text>
                    </Row>
                  ))}
                </Box>
              </Box>
              {additional}
            </Box>
          )}
          renderFooter={() => (
            <Box horizontal grow>
              <Box grow>{footerLeft}</Box>
              <Button ml={2} secondary onClick={onClose}>
                <Trans i18nKey="common.cancel" />
              </Button>
              <Button ml={2} primary onClick={onNextFn} data-test-id="modal-continue-button">
                {nextLabel || <Trans i18nKey="common.continue" />}
              </Button>
            </Box>
          )}
        />
      )}
    />
  );
}
const RewardImg = styled.img.attrs(() => ({
  src: Rewards,
}))`
  width: 130px;
  height: auto;
`;
const Row = styled(Box).attrs(p => ({
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
