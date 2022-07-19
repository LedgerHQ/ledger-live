// @flow
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import Check from "~/renderer/icons/CheckFull";
import TrackPage from "~/renderer/analytics/TrackPage";
import Votes from "~/renderer/images/votes.svg";
import useTheme from "~/renderer/hooks/useTheme";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";

type Props = {
  name?: string,
  onNext: () => void,
  nextLabel?: React$Node,
  description: string,
  bullets: string[],
  additional: React$Node,
  footerLeft?: React$Node,
};

export default function VoteInfoModal({
  name,
  onNext,
  nextLabel,
  description,
  bullets,
  additional,
  footerLeft,
}: Props) {
  const infoColor = useTheme("colors.positiveGreen");

  return (
    <Modal
      name={name}
      centered
      render={({ onClose, data }) => (
        <ModalBody
          title={<Trans i18nKey="vote.title" />}
          onClose={onClose}
          render={onClose => (
            <Box flow={4} mx={4}>
              <TrackPage category="Vote Flow" name="Step Starter" />
              <Box flow={1} alignItems="center">
                <Box mb={4}>
                  <VoteImg />
                </Box>
                <Box mb={4}>
                  <Text
                    ff="Inter|SemiBold"
                    fontSize={13}
                    textAlign="center"
                    color="palette.text.shade80"
                    style={{ lineHeight: 1.57 }}
                  >
                    {description}
                  </Text>
                </Box>
                <Box>
                  {bullets.map((val, i) => (
                    <Row key={val + i}>
                      <Check size={16} color={infoColor} />
                      <Text
                        ff="Inter|SemiBold"
                        style={{ lineHeight: 1.57, flex: 1 }}
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
              <Button ml={2} primary onClick={onNext}>
                {nextLabel || <Trans i18nKey="common.continue" />}
              </Button>
            </Box>
          )}
        />
      )}
    />
  );
}

const VoteImg = styled.img.attrs(() => ({ src: Votes }))`
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
