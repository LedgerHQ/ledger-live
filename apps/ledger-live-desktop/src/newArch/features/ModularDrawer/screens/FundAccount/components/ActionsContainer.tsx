import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { Account } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { IconContainer } from "./IconContainer";

const ActionItem = styled(Flex)`
  cursor: pointer;
  padding: 12px;

  border-radius: 8px;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${p => p.theme.colors.opacityDefault.c05};
  }

  &:active {
    background-color: ${p => p.theme.colors.opacityDefault.c10};
  }
`;

const Container = styled(Flex)`
  width: calc(100% + 72px);
  margin-left: -36px;
  margin-right: -36px;
`;

interface Props {
  account: Account;
  currencyId: string;
}

const ActionsContainer = ({ account, currencyId }: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { isCurrencyAvailable } = useRampCatalog();

  const handleReceive = useCallback(() => {
    setDrawer();
    if (location.pathname === "/manager") history.push("/accounts");
    dispatch(openModal("MODAL_RECEIVE", { account }));
  }, [account, dispatch, history]);

  const handleBuy = useCallback(() => {
    setDrawer();
    history.push({
      pathname: "/exchange",
      state: { currency: currencyId, account: account.id, mode: "buy" },
    });
  }, [currencyId, account.id, history]);

  const actions = useMemo(() => {
    const baseActions = [
      {
        label: t("modularAssetDrawer.fundAccount.receive"),
        description: t("modularAssetDrawer.fundAccount.receiveDescription"),
        icon: <Icons.ArrowDown size="S" />,
        onClick: handleReceive,
      },
    ];

    if (isCurrencyAvailable(currencyId, "onRamp")) {
      baseActions.push({
        label: t("modularAssetDrawer.fundAccount.buy"),
        description: t("modularAssetDrawer.fundAccount.buyDescription"),
        icon: <Icons.Plus size="S" />,
        onClick: handleBuy,
      });
    }

    return baseActions;
  }, [t, handleReceive, handleBuy, isCurrencyAvailable, currencyId]);

  return (
    <Container
      flexDirection="column"
      alignItems="center"
      borderTop="1px solid"
      borderColor="opacityDefault.c10"
      height="100%"
      flex={1}
    >
      <Flex flexDirection="column" width="100%" paddingX={24} paddingTop={24} rowGap={12}>
        {actions.map((action, index) => (
          <ActionItem
            key={index}
            onClick={action.onClick}
            flexDirection="row"
            alignItems="center"
            columnGap={16}
          >
            <IconContainer icon={action.icon} />
            <Flex flexDirection="column" flex={1}>
              <Text fontSize={16} fontWeight="600">
                {action.label}
              </Text>
              <Text color="neutral.c70" fontSize={14} variant="body" fontWeight="medium">
                {action.description}
              </Text>
            </Flex>
          </ActionItem>
        ))}
      </Flex>
    </Container>
  );
};

export default ActionsContainer;
