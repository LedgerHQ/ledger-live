import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import ToggleButton from "~/renderer/components/ToggleButton";
import InfoCircle from "~/renderer/icons/InfoCircle";
import Text from "~/renderer/components/Text";
import Popover from "~/renderer/components/Popover";
import { MultiversXTransactionMode } from "@ledgerhq/live-common/families/multiversx/types";

export interface Props {
  mode: string;
  onChange: (mode: MultiversXTransactionMode) => void;
}
const options = [
  {
    value: "reDelegateRewards",
    label: <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.compound" />,
  },
  {
    value: "claimRewards",
    label: <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.claim" />,
  },
];
const ModeSelectorField = (props: Props) => {
  const { mode, onChange } = props;
  return (
    <Box
      style={{
        width: 300,
      }}
      alignSelf="center"
    >
      <ToggleButton value={mode} options={options} onChange={onChange as (a: string) => void} />

      <Box
        horizontal={true}
        alignItems="center"
        justifyContent="center"
        color="palette.text.shade60"
      >
        <Popover
          position="right"
          content={
            <Box px={2}>
              <Box alignItems="start" justifyContent="start" my={2}>
                <Text ff="Inter|SemiBold" fontSize={4} color="palette.primary.main">
                  <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.compound" />
                </Text>

                <Text fontSize={3} textAlign="left" color="palette.text.shade80">
                  <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.compoundDescription" />
                </Text>
              </Box>

              <Box alignItems="start" justifyContent="start" my={2}>
                <Text ff="Inter|SemiBold" fontSize={4} color="palette.primary.main">
                  <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.claim" />
                </Text>

                <Text fontSize={3} textAlign="left" color="palette.text.shade80">
                  <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.claimDescription" />
                </Text>
              </Box>
            </Box>
          }
        >
          <Box horizontal={true} alignItems="center" p={2} justifyContent="center">
            <Text ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey="elrond.claimRewards.flow.steps.claimRewards.compoundOrClaim" />
            </Text>

            <Box ml={1}>
              <InfoCircle size={16} />
            </Box>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};
export default ModeSelectorField;
