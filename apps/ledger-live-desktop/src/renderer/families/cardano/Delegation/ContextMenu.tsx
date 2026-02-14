import React from "react";
import styled, { useTheme } from "styled-components";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import UserEdit from "~/renderer/icons/UserEdit";
import StopCircle from "~/renderer/icons/StopCircle";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

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
  account: CardanoAccount;
};

const ContextMenu = ({ account }: Props) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const hasRewardsWithNoDrepDelegation =
    account.cardanoResources.delegation?.rewards.isGreaterThan(0) &&
    account.cardanoResources.delegation?.dRepHex === undefined;

  const modalNameForUndelegate = hasRewardsWithNoDrepDelegation
    ? "MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO"
    : "MODAL_CARDANO_UNDELEGATE";

  const items = [
    {
      key: "redelegate",
      label: (
        <Box color="neutral.c100" data-testid="delegation-redelegate-button">
          <Trans i18nKey="cardano.delegation.changeDelegation" />
        </Box>
      ),
      icon: (
        <Box color="neutral.c100">
          <UserEdit size={16} />
        </Box>
      ),
      onClick: () =>
        dispatch(
          openModal("MODAL_CARDANO_DELEGATE", {
            account,
          }),
        ),
    },
    {
      key: "stopDelegation",
      label: (
        <Box color="alertRed" data-testid="delegation-undelegate-button">
          <Trans i18nKey="delegation.contextMenu.stopDelegation" />
        </Box>
      ),
      icon: (
        <Box color="alertRed">
          <StopCircle size={16} />
        </Box>
      ),
      onClick: () =>
        dispatch(
          openModal(modalNameForUndelegate, {
            account,
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
    return (
      <Item horizontal flow={2} onClick={item.onClick}>
        {item.icon ? <Box mr={12}>{item.icon}</Box> : null}
        <Text ff="Inter|SemiBold" fontSize={3}>
          {item.label}
        </Text>
      </Item>
    );
  };
  return (
    <DropDownSelector items={items} renderItem={renderItem}>
      {() => (
        <Container
          data-testid="delegation-context-menu-button"
          style={{
            width: 34,
            padding: 0,
          }}
        >
          <Box horizontal flow={1} alignItems="center" justifyContent="center">
            <IconsLegacy.OthersMedium size={14} color={theme.colors.neutral.c70} />
          </Box>
        </Container>
      )}
    </DropDownSelector>
  );
};

export default ContextMenu;
