import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import Tooltip from "~/renderer/components/Tooltip";
import { CopiableField } from "../../../components/CopialbleField";
import { BoxWithBackground } from "../../../components/BoxWithBackground";
import { StyledIconInfo } from "../../../components/StyledIconInfo";

const Section = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 12px;
  padding: 16px;
  width: 100%;
`;

type NeuronHeaderProps = {
  stakeAmount: bigint;
  neuronId: string;
  votingPower: number;
  isDeviceControlled: boolean;
  unit: Unit;
};

export function NeuronHeader({
  stakeAmount,
  neuronId,
  votingPower,
  isDeviceControlled,
  unit,
}: NeuronHeaderProps) {
  const { t } = useTranslation();

  return (
    <Section>
      <Box style={{ alignItems: "center" }}>
        <Box alignItems="center" mb={2}>
          <Text ff="Inter|SemiBold" fontSize={8}>
            <FormattedVal val={Number(stakeAmount)} unit={unit} showCode />
          </Text>
          {!isDeviceControlled && (
            <BoxWithBackground>
              <Box horizontal alignItems="center">
                <Text ff="Inter|Bold" fontSize={3} mr={1} color="palette.text.shade60">
                  <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.hotkeyControl" />
                </Text>
                <Tooltip
                  content={t(
                    "internetComputer.manageNeuronFlow.manage.header.hotkeyControlDescription",
                  )}
                >
                  <StyledIconInfo size={14} />
                </Tooltip>
              </Box>
            </BoxWithBackground>
          )}
        </Box>
        <Box horizontal alignItems="center">
          <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
            <Trans i18nKey="internetComputer.common.neuronId" />:
          </Text>
          <CopiableField value={neuronId}>
            <Text ff="Inter|SemiBold" fontSize={4}>
              {neuronId}
            </Text>
          </CopiableField>
        </Box>
        <Box horizontal alignItems="center">
          <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
            <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.votingPower" />:
          </Text>
          <Text ff="Inter|SemiBold" fontSize={4}>
            {votingPower > 0 ? (
              <FormattedVal val={votingPower} unit={unit} color="palette.text.shade100" />
            ) : (
              <Trans i18nKey="internetComputer.manageNeuronFlow.manage.header.noVotingPower" />
            )}
          </Text>
        </Box>
      </Box>
    </Section>
  );
}
