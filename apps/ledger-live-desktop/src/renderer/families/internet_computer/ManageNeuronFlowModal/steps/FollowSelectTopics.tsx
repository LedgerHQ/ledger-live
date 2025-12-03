import React, { useCallback } from "react";
import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import WarnBox from "~/renderer/components/WarnBox";
import CollapsibleCard from "~/renderer/components/CollapsibleCard";
import { StepProps } from "../types";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";

type KnownTopic = keyof typeof KNOWN_TOPICS;
const topicsList = Object.entries(KNOWN_TOPICS);

export function StepFollowSelectTopics({ setFollowTopic, transitionTo }: StepProps) {
  const { t } = useTranslation();
  const onClickSelectTopic = useCallback(
    (topic: KnownTopic) => {
      setFollowTopic(topic);
      transitionTo("selectFollowees");
    },
    [setFollowTopic, transitionTo],
  );

  return (
    <Box>
      <WarnBox>
        <Trans i18nKey="internetComputer.manageNeuronFlow.selectTopics.warnbox" />
      </WarnBox>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={14} mb={10}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.selectTopics.listOfTopics" />
        </Text>
        <Box style={{ gap: 10 }}>
          {topicsList.map(([key]) => (
            <Box
              key={key}
              style={{
                flexDirection: "row",
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <CollapsibleCard
                header={
                  <Text ff="Inter|SemiBold" fontSize={14}>
                    {t(`internetComputer.manageNeuron.followTopic.${key}.title`)}
                  </Text>
                }
                bg="palette.background.default"
                padding={10}
                width="100%"
              >
                <Box
                  style={{
                    flexDirection: "column",
                    gap: 10,
                    marginLeft: "auto",
                    padding: "0 40px",
                  }}
                >
                  <Text ff="Inter|Regular" fontSize={14}>
                    {t(`internetComputer.manageNeuron.followTopic.${key}.description`)}
                  </Text>
                  <Button
                    primary
                    style={{ margin: "auto" }}
                    onClick={() => onClickSelectTopic(parseInt(key) as KnownTopic)}
                  >
                    <Trans i18nKey="internetComputer.manageNeuronFlow.selectTopics.addAction" />
                  </Button>
                </Box>
              </CollapsibleCard>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
