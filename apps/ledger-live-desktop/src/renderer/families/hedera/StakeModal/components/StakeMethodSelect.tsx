// @flow

import React from "react";
import { Trans, useTranslation } from "react-i18next";

import Text from "~/renderer/components/Text";
import CheckBox from "~/renderer/components/CheckBox";
import Box from "~/renderer/components/Box";
import Icon from "~/renderer/icons/Apps";
import { STAKE_METHOD } from "@ledgerhq/live-common/families/hedera/types";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";

// const { t } = useTranslation();

type Item = {
  label: React$Node;
  key: string;
};

type Props = {
  items: Array<Item>;
  activeKey: string;
  selectNode: () => void;
  selectAccount: () => void;
};

const radioBoxStyle = {
  border: "1px solid #3C3C3C",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "16px",
};

const radioBoxActiveStyle = {
  background: "#2D2A3D",
  color: "#D4CCFF",
  borderRadius: "8px",
  padding: "16px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "16px",
};

const iconBackgroundStyle = {
  borderRadius: "32px",
  background: "rgba(255, 255, 255, 0.05)",
  height: "40px",
  width: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const textArea = {
  width: "292px",
};

// FIXME: Icons are stand ins until the real ones can be imported/located

const StakeMethodSelect: React.FC<Props> = ({
  items,
  activeKey,
  selectNode,
  selectAccount,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "center",
      }}
    >
      <Box vertical style={{ gap: "16px" }}>
        <Box
          onClick={selectNode}
          style={activeKey === STAKE_METHOD.NODE ? radioBoxActiveStyle : radioBoxStyle}
        >
          <Box style={iconBackgroundStyle}>
            <Icon size={14} />
          </Box>
          <Box style={textArea}>
            <Text ff="Inter|SemiBold" fontSize={14} lineHeight="130%" mb="2px">
              <Trans i18nKey="hedera.stake.flow.stake.nodeTitle" />
            </Text>
            <Text ff="Inter" fontSize={14}>
              <Trans i18nKey="hedera.stake.flow.stake.nodeSubtitle" />
            </Text>
          </Box>
          <CheckBox isRadio isChecked={activeKey === STAKE_METHOD.NODE} onChange={selectNode} />
        </Box>
        <Box
          onClick={selectAccount}
          style={activeKey === STAKE_METHOD.ACCOUNT ? radioBoxActiveStyle : radioBoxStyle}
        >
          <Box style={iconBackgroundStyle}>
            <Icon size={14} />
          </Box>
          <Box style={textArea}>
            <Text ff="Inter|SemiBold" fontSize={14} lineHeight="130%" mb="2px">
              <Trans i18nKey="hedera.stake.flow.stake.accountTitle" />
            </Text>
            <Text ff="Inter" fontSize={14}>
              <Trans i18nKey="hedera.stake.flow.stake.accountSubtitle" />
            </Text>
          </Box>
          <CheckBox
            isRadio
            isChecked={activeKey === STAKE_METHOD.ACCOUNT}
            onChange={selectAccount}
          />
        </Box>
      </Box>
      <LinkWithExternalIcon
        style={{ marginTop: "34px" }}
        fontSize={14}
        onClick={() => openURL("https://docs.hedera.com/hedera/core-concepts/staking/stake-hbar")}
        label={t("hedera.stake.flow.stake.howItWorks")}
      />
    </div>
  );
};

export default StakeMethodSelect;
