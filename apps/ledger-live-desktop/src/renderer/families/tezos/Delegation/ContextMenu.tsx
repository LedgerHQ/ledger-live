import React from "react";
import styled, { useTheme } from "styled-components";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { useDelegation } from "@ledgerhq/live-common/families/tezos/bakers";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import UserEdit from "~/renderer/icons/UserEdit";
import ArrowDown from "~/renderer/icons/ArrowDown";
import StopCircle from "~/renderer/icons/StopCircle";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { Icons } from "@ledgerhq/react-ui";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
`;
const Item = styled(DropDownItem)`
  width: 160px;
  cursor: pointer;
  white-space: pre-wrap;
  justify-content: flex-start;
  align-items: center;
`;
type Props = {
  account: TezosAccount;
};
const ContextMenu = ({ account }: Props) => {
  const dispatch = useDispatch();
  const delegation = useDelegation(account);
  const theme = useTheme();
  const receiveShouldWarnDelegation = delegation
    ? delegation.receiveShouldWarnDelegation
    : undefined;
  const items = [
    {
      key: "topUp",
      label: <Trans i18nKey="delegation.contextMenu.topUp" />,
      icon: <ArrowDown size={16} />,
      onClick: () =>
        dispatch(
          openModal("MODAL_RECEIVE", {
            account,
            eventType: "tezos",
            startWithWarning: receiveShouldWarnDelegation,
          }),
        ),
    },
    {
      key: "redelegate",
      label: <Trans i18nKey="delegation.contextMenu.redelegate" />,
      icon: <UserEdit size={16} />,
      onClick: () =>
        dispatch(
          openModal("MODAL_DELEGATE", {
            account,
            eventType: "redelegate",
            stepId: "summary",
          }),
        ),
    },
    {
      key: "stopDelegation",
      label: <Trans i18nKey="delegation.contextMenu.stopDelegation" />,
      icon: <StopCircle size={16} />,
      onClick: () =>
        dispatch(
          openModal("MODAL_DELEGATE", {
            account,
            eventType: "undelegate",
            mode: "undelegate",
            stepId: "summary",
          }),
        ),
    },
  ];
  const renderItem = ({
    item,
  }: {
    item: {
      key: string;
      label: React.ReactNode;
      icon: React.ReactNode;
      onClick: () => void;
    };
  }) => {
    const color = item.key === "stopDelegation" ? "alertRed" : "palette.text.shade100";
    return (
      <Item horizontal flow={2} onClick={item.onClick}>
        {item.icon ? (
          <Box mr={12} color={color}>
            {item.icon}
          </Box>
        ) : null}
        <Text ff="Inter|SemiBold" fontSize={3} color={color}>
          {item.label}
        </Text>
      </Item>
    );
  };
  return (
    <DropDownSelector items={items} renderItem={renderItem}>
      {() => (
        <Container
          style={{
            width: 34,
            padding: 0,
          }}
        >
          <Box horizontal flow={1} alignItems="center" justifyContent="center">
            <Icons.OthersMedium size={14} color={theme.colors.palette.text.shade50} />
          </Box>
        </Container>
      )}
    </DropDownSelector>
  );
};
export default ContextMenu;
