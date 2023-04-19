// @flow

import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";

import type { StepProps } from "../types";
import { getEstimatedFees, getHederaUsd } from "@ledgerhq/live-common/families/hedera/utils";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";

const StepSummary = ({ account, transaction, nodeListOptions, }: StepProps) => {
  let nodeDescription: string | undefined = "";
  if (transaction?.staked?.nodeId != null) {
    nodeDescription = nodeListOptions?.find(option => option.label == transaction?.staked?.nodeId?.toString())?.description;
    nodeDescription = nodeDescription?.replace("Hosted by ", "");
  }

  const [fee, setFee] = useState(0);

  useEffect(() => {
    async function getEstimatedFee() {
      const estimatedTransferFee = await getEstimatedFees();
      const feeIntermediate = estimatedTransferFee.dividedBy(100_000_000).multipliedBy(2.2).toNumber();
      setFee(feeIntermediate);
    }
    getEstimatedFee();
  }, []);

  const { t } = useTranslation();

  return (
    <Box>
      <Box style={{ display: "flex", gap: "18px", margin: "0px 32px", padding: "16px", background: "#232425", borderRadius: "8px", }}>

        {/* Amount to stake ... */}
        <Box style={{ alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between", }}>
          <Box style={{ color: "#949494", fontFamily: "Inter", fontWeight: "600", fontSize: "11px", lineHeight: "13px" }}>
            <Trans i18nKey="hedera.stake.flow.summary.amount"/>
          </Box>
          <Box style={{ display: "flex", flexDirection: "row", gap: "8px", }}>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "700", fontSize: "10px", lineHeight: "170%", background: "#717070", borderRadius: "100px", width: "16px", height: "16px", textAlign: "center", verticalAlign: "center", }}>
              H
            </Box>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "500", fontSize: "14px", lineHeight: "130%" }}>
              { account?.balance.dividedBy(100_000_000).toNumber().toFixed(8) } HBAR
            </Box>
          </Box>
        </Box>

        {/* Staking Type ... */}
        <Box style={{ alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between", }}>
          <Box style={{ color: "#949494", fontFamily: "Inter", fontWeight: "600", fontSize: "11px", lineHeight: "13px" }}>
            <Trans i18nKey="hedera.stake.flow.summary.type" />
          </Box>
          <Box style={{ display: "flex", flexDirection: "row", gap: "8px", }}>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "500", fontSize: "14px", lineHeight: "130%" }}>
              { transaction?.staked?.nodeId != null ? <Trans i18nKey="hedera.stake.flow.summary.nodeType"/> : <Trans i18nKey="hedera.stake.flow.summary.userType"/> }
            </Box>
          </Box>
        </Box>

        {/* Node or Account */}
        <Box style={{ alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between", }}>
          <Box style={{ color: "#949494", fontFamily: "Inter", fontWeight: "600", fontSize: "11px", lineHeight: "13px" }}>
            {transaction?.staked?.nodeId != null ? <Trans i18nKey="hedera.stake.flow.summary.node" /> : <Trans i18nKey="hedera.stake.flow.summary.user" />}
          </Box>
          <Box style={{ display: "flex", flexDirection: "row", gap: "8px", }}>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "700", fontSize: "10px", lineHeight: "170%", background: "#717070", borderRadius: "100px", width: "16px", height: "16px", textAlign: "center", verticalAlign: "center", }}>
              H
            </Box>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "500", fontSize: "14px", lineHeight: "130%" }}>
              { transaction?.staked?.nodeId != null ? nodeDescription : transaction?.staked?.accountId }
            </Box>
          </Box>
        </Box>

        {/* Total Fees */}
        <Box style={{ alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between", }}>
          <Box style={{ color: "#949494", fontFamily: "Inter", fontWeight: "600", fontSize: "11px", lineHeight: "13px" }}>
            <Trans i18nKey="hedera.stake.flow.summary.fees"/>
          </Box>
          <Box style={{ display: "flex", flexDirection: "row", gap: "6px", }}>
            <Box style={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: "500", fontSize: "14px", lineHeight: "130%" }}>
              { fee.toFixed(4) } HBAR
            </Box>
            <Box style={{  color: "#949494", fontFamily: "Inter", fontWeight: "500", fontSize: "14px", lineHeight: "130%" }}>
              $0.00022
            </Box>
          </Box>
        </Box>

        {/* 
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.stake.to" />
          </Text> */}

          {/* ... node */}
          {/* {transaction.staked.nodeId != null ? (
            <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
              <Trans i18nKey="hedera.common.node" /> {transaction.staked.nodeId}
            </Text>
          ) : null} */}

          {/* ... account */}
          {/* {transaction.staked.accountId != null ? (
            <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
              <Trans i18nKey="hedera.common.account" />{" "}
              {transaction.staked.accountId}
            </Text>
          ) : null}
        </div> */}

        {/* Receive rewards? */}
        {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.summary.receiveRewards" />
          </Text>

          <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
            {!transaction.staked.declineRewards ? (
              <Trans i18nKey="hedera.common.yes" />
            ) : (
              <Trans i18nKey="hedera.common.no" />
            )}
          </Text>
        </div> */}
      </Box>
      { transaction?.staked?.nodeId != null ? null : 
        <Box style={{ margin: "32px 32px 0px 32px", background: "#3E2909", padding: "16px", borderRadius: "8px", fontFamily: "Inter", fontWeight: "600", fontSize: "14px", lineHeight: "150%" }}>
          <Trans i18nKey="hedera.stake.flow.summary.userWarning"/>
          <LinkWithExternalIcon
            style={{ marginTop: "4px", color: "#FFFFFF" }}
            fontSize={14}
            onClick={() => openURL("https://docs.hedera.com/hedera/core-concepts/staking/stake-hbar")}
            label={t("hedera.stake.flow.summary.howItWorks")}
          />
        </Box>
      }
    </Box>
  );
};

export const StepSummaryFooter = ({ transitionTo, onClose }: StepProps) => {
  return (
    <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginLeft: "0px", width: "100%", }}>
      <Button outline mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button primary onClick={() => transitionTo("connectDevice")}>
        <Trans i18nKey="hedera.stake.flow.summary.stakeHedera" />
      </Button>
    </Box>
  );
};

export default StepSummary;