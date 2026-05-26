import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Check from "~/renderer/icons/CheckFull";
import TrackPage from "~/renderer/analytics/TrackPage";
import { closeModal } from "~/renderer/actions/modals";
import Rewards from "~/renderer/images/rewards.svg";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { useDispatch } from "LLD/hooks/redux";
import { ModalData } from "~/renderer/modals/types";

type Props<Name extends keyof ModalData> = {
  name: Name;
  onNext: (option: "dRep" | "noConfidence" | "abstain") => void;
  nextLabel?: React.ReactNode;
  description: string;
  bullets: string[];
  additional: React.ReactNode;
  footerLeft?: React.ReactNode;
  currency: string;
  hideFooterButtons?: boolean;
};

export default function VoteDelegationInfoModal<Name extends keyof ModalData>({
  name,
  onNext,
  description,
  bullets,
  additional,
  currency,
}: Props<Name>) {
  const dispatch = useDispatch();
  const onNextFn = useCallback(
    (option: "dRep" | "noConfidence" | "abstain") => () => {
      dispatch(closeModal(name));
      onNext(option);
    },
    [dispatch, name, onNext],
  );
  return (
    <Modal
      name={name}
      centered
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="voteDelegation.header" />}
          onClose={onClose}
          render={() => (
            <Box flow={4} mx={4}>
              <TrackPage
                category="Vote Delegation Flow"
                name="Step Starter"
                type="modal"
                flow="vote-delegation"
                action="vote-delegation"
                page="Vote Delegation Info"
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
                <Box mt={4} horizontal justifyContent="center" flow={4}>
                  <Button primary onClick={onNextFn("dRep")}>
                    <Trans i18nKey="voteDelegation.options.dRep" />
                  </Button>
                  <Button primary onClick={onNextFn("noConfidence")}>
                    <Trans i18nKey="voteDelegation.options.alwaysNoConfidence" />
                  </Button>
                  <Button primary onClick={onNextFn("abstain")}>
                    <Trans i18nKey="voteDelegation.options.alwaysAbstain" />
                  </Button>
                </Box>
              </Box>
              {additional}
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
