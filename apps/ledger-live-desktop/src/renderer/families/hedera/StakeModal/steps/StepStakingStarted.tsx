import React from "react";
import type { StepProps } from "../types";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Trans, useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";

const StepStakingInfo = ({
    setContinueClicked
}: StepProps) => {
    setContinueClicked(false);
    const row = {
        borderBottom: "1px solid #3C3C3C",
        marginLeft: "16px",
        marginRight: "16px",
        paddingTop: "16px",
        paddingBottom: "16px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "12px",
    };

    const lastRow = {
        marginLeft: "16px",
        marginRight: "16px",
        paddingTop: "16px",
        paddingBottom: "16px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "12px",
    };

    return (
        <Box>
            <Box style={{ justifyContent: "center", textAlign: "center", display: "flex", flexDirection: "row",}}>
                <Text ff="Inter|SemiBold" fontSize={24} lineHeight="135%" mb="32px" style={{width: "335px"}}>
                    <Trans i18nKey="hedera.stake.flow.started.title" />
                </Text>
            </Box>
            <Box style={row}>
                <Icons.NetworkWiredMedium size={24} color="#BBB0FF" />
                <Text ff="Inter|SemiBold" fontSize={14} lineHeight="17px">
                    <Trans i18nKey="hedera.stake.flow.started.stake" />
                </Text>
            </Box>
            <Box style={row}>
                <Icons.UnlockMedium size={24} color="#BBB0FF" />
                <Text ff="Inter|SemiBold" fontSize={14} lineHeight="17px">
                    <Trans i18nKey="hedera.stake.flow.started.noLock" />
                </Text>
            </Box>
            <Box style={row}>
                <Icons.CubeMedium size={24} color="#BBB0FF" />
                <Text ff="Inter|SemiBold" fontSize={14} lineHeight="17px">
                    <Trans i18nKey="hedera.stake.flow.started.receive" />
                </Text>
            </Box>
            <Box style={lastRow}>
                <Icons.HandHoldingCoinMedium size={24} color="#BBB0FF" />
                <Text ff="Inter|SemiBold" fontSize={14} lineHeight="17px">
                    <Trans i18nKey="hedera.stake.flow.started.donate" />
                </Text>
            </Box>
        </Box>
    );
};
  
export const StepStakingStartedFooter = ({
    t,
    bridgePending,
    status,
    transitionTo,
    account,
    onClose,
    continueClicked,
    setContinueClicked,
    transaction,
    parentAccount,
    optimisticOperation,
    stakeMethod
}: StepProps) => {
return (
    <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginLeft: "0px", width: "100%", }}>
        <Button outline mr={1} secondary onClick={onClose}>
            <Trans i18nKey="common.cancel" />
        </Button>
        <Button primary onClick={() => transitionTo("stake")}>
            <Trans i18nKey="common.continue" />
        </Button>
    </Box>
);
}

export default StepStakingInfo