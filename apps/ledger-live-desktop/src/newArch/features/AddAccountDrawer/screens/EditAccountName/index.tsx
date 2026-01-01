import { accountNameWithDefaultSelector, setAccountName } from "@ledgerhq/live-wallet/lib-es/store";
import { Button, Flex, Text } from "@ledgerhq/react-ui/index";
import { TextInput } from "@ledgerhq/react-ui/pre-ldls/index";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";
import { FOOTER_PADDING_BOTTOM_PX, FOOTER_PADDING_TOP_PX } from "../styles";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";

interface Props {
  account: Account;
  navigateBack?: (track?: boolean) => void;
}

const MAX_ACCOUNT_NAME_LENGTH = 50;

const EditAccountName = ({ account, navigateBack }: Props) => {
  const source = useSelector(modularDrawerSourceSelector);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const walletState = useSelector(walletSelector);
  const accountName = useMemo(
    () => accountNameWithDefaultSelector(walletState, account),
    [account, walletState],
  );

  const [name, setName] = useState<string>(accountNameWithDefaultSelector(walletState, account));
  const cleanAccountName = name.trim();

  const handleSave = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Save",
      page: ADD_ACCOUNT_PAGE_NAME.EDIT_ACCOUNT_NAME_ACTIONS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });

    dispatch(setAccountName(account.id, cleanAccountName));

    navigateBack?.();
  }, [account.id, cleanAccountName, dispatch, navigateBack, trackAddAccountEvent]);

  return (
    <>
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.EDIT_ACCOUNT_NAME_ACTIONS}
        flow={ADD_ACCOUNT_FLOW_NAME}
        source={source}
      />
      <Flex marginBottom={24}>
        <Text
          fontSize={24}
          flex={1}
          textAlign="left"
          width="100%"
          lineHeight="32.4px"
          color="neutral.c100"
          data-testid="scan-accounts-title"
        >
          {t("modularAssetDrawer.editAccountName.title")}
        </Text>
      </Flex>
      <Flex flex={1} marginBottom={24}>
        <TextInput
          aria-label="account name"
          defaultValue={name}
          label={t("modularAssetDrawer.editAccountName.input.name")}
          name="accountName"
          onChange={e => setName(e.target.value)}
          style={{
            width: "100%",
          }}
          maxLength={MAX_ACCOUNT_NAME_LENGTH}
        />
      </Flex>
      <Flex
        justifyContent="flex-end"
        paddingBottom={FOOTER_PADDING_BOTTOM_PX}
        paddingTop={FOOTER_PADDING_TOP_PX}
        zIndex={1}
      >
        <Button
          alignItems="center"
          disabled={cleanAccountName.length === 0 || accountName === cleanAccountName}
          flex={1}
          onClick={handleSave}
          size="xl"
          variant="main"
        >
          {t("modularAssetDrawer.editAccountName.cta.save")}
        </Button>
      </Flex>
    </>
  );
};

export default EditAccountName;
