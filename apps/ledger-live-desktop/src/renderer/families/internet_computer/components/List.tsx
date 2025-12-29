import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import WarnBox from "~/renderer/components/WarnBox";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import {
  getNeuronDissolveDuration,
  secondsToDurationString,
  getSecondsTillVotingPowerExpires,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";

const TableWrapper = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 8px 16px;
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
  text-align: left;
  font-family: "Inter";
  font-weight: normal;
  font-size: 12px;
  white-space: nowrap;
`;

const Tr = styled.tr<{ pointer?: boolean }>`
  cursor: ${p => (p.pointer ? "pointer" : "default")};
  &:hover {
    background: ${p => p.theme.colors.background.default};
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  font-family: "Inter";
  font-size: 12px;
  white-space: nowrap;
`;

type ListProps = {
  neurons: {
    fullNeurons: ICPNeuron[];
    lastUpdatedMSecs?: number;
  };
  modalName: "MODAL_ICP_LIST_NEURONS" | "MODAL_ICP_REFRESH_VOTING_POWER";
  unit: Unit;
  onClickManage?: (index: number) => void;
  onClickConfirmFollowing?: (neuron: ICPNeuron) => void;
};

export function List({
  neurons,
  modalName,
  unit,
  onClickManage,
  onClickConfirmFollowing,
}: ListProps) {
  const { t } = useTranslation();
  if (!neurons.fullNeurons.length) {
    return (
      <Box>
        <WarnBox>{t("internetComputer.listNeurons.warnbox")}</WarnBox>
      </Box>
    );
  }

  return (
    <Box>
      <TableWrapper>
        <StyledTable>
          <thead>
            <tr>
              <Th style={{ width: "25%" }}>{t("internetComputer.common.neuronIds")}</Th>
              {modalName === "MODAL_ICP_LIST_NEURONS" && (
                <>
                  <Th style={{ width: "20%" }}>{t("internetComputer.common.stake")}</Th>
                  <Th style={{ width: "20%" }}>{t("internetComputer.common.maturity")}</Th>
                  <Th style={{ width: "20%" }}>{t("internetComputer.common.dissolveDelay")}</Th>
                  <Th style={{ width: "15%" }}>{t("internetComputer.common.state")}</Th>
                </>
              )}
              {modalName === "MODAL_ICP_REFRESH_VOTING_POWER" && (
                <>
                  <Th style={{ width: "50%" }}>
                    {t("internetComputer.listNeurons.timeUntilRewardLoss")}
                  </Th>
                  <Th style={{ width: "25%" }}>{t("internetComputer.common.action")}</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {neurons.fullNeurons.map(
              (neuron, index) =>
                (neuron.cached_neuron_stake_e8s.toString() !== "0" ||
                  neuron.maturity_e8s_equivalent > 0) && (
                  <Tr
                    key={neuron.id[0]?.id}
                    pointer={modalName === "MODAL_ICP_LIST_NEURONS" && !!onClickManage}
                    onClick={() => {
                      if (modalName === "MODAL_ICP_LIST_NEURONS" && onClickManage) {
                        onClickManage(index);
                      }
                    }}
                  >
                    <Td>
                      <Text ff="Inter|SemiBold" fontSize={3}>
                        {neuron.id[0]?.id.toString()}
                      </Text>
                    </Td>
                    {modalName === "MODAL_ICP_LIST_NEURONS" && (
                      <>
                        <Td>
                          <FormattedVal
                            val={Number(neuron.cached_neuron_stake_e8s)}
                            unit={unit}
                            showCode
                            fontSize={3}
                          />
                        </Td>
                        <Td style={{ textAlign: "center" }}>
                          <FormattedVal
                            color="palette.text.shade100"
                            val={
                              Number(neuron.staked_maturity_e8s_equivalent[0] ?? 0) +
                              Number(neuron.maturity_e8s_equivalent)
                            }
                            unit={unit}
                          />
                        </Td>
                        <Td style={{ textAlign: "center" }}>
                          <Text ff="Inter|Regular" fontSize={3}>
                            {neuron.dissolveState !== "Unlocked"
                              ? getNeuronDissolveDuration(neuron)
                              : "-"}
                          </Text>
                        </Td>
                        <Td>
                          <Text ff="Inter|Regular" fontSize={3}>
                            {neuron.dissolveState}
                          </Text>
                        </Td>
                      </>
                    )}
                    {modalName === "MODAL_ICP_REFRESH_VOTING_POWER" && (
                      <>
                        {(() => {
                          const secondsTillVotingPowerExpires =
                            getSecondsTillVotingPowerExpires(neuron);

                          return (
                            <>
                              <Td>
                                <Text ff="Inter|Regular" fontSize={3}>
                                  {secondsTillVotingPowerExpires > 0 ? (
                                    secondsToDurationString(
                                      secondsTillVotingPowerExpires.toString(),
                                    )
                                  ) : (
                                    <Text ff="Inter|Regular" fontSize={3}>
                                      {t("internetComputer.common.inactiveNeuron")}
                                    </Text>
                                  )}
                                </Text>
                              </Td>
                              <Td>
                                {onClickConfirmFollowing && (
                                  <Button primary onClick={() => onClickConfirmFollowing(neuron)}>
                                    {t("internetComputer.common.confirmFollowing")}
                                  </Button>
                                )}
                              </Td>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </Tr>
                ),
            )}
          </tbody>
        </StyledTable>
      </TableWrapper>
    </Box>
  );
}

export default List;
