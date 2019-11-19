// @flow
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { useDelegation } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import {
  ReceiveActionDefault,
  SendActionDefault,
} from "../../screens/Account/AccountActionsDefault";
import InfoModal from "../../components/InfoModal";

const SendAction = ({ onPress, account, ...rest }) => {
  const [isOpened, setOpened] = useState(false);
  const delegation = useDelegation(account);
  const sendShouldWarnDelegation =
    delegation && delegation.sendShouldWarnDelegation;

  const onPressDecorated = useCallback(() => {
    if (!isOpened && sendShouldWarnDelegation) {
      setOpened(true);
    } else {
      if (isOpened) setOpened(false);
      onPress();
    }
  }, [isOpened, sendShouldWarnDelegation, onPress]);

  const onClose = useCallback(() => {
    setOpened(false);
  }, []);

  return (
    <>
      <InfoModal
        withCancel
        onContinue={onPressDecorated}
        onClose={onClose}
        isOpened={isOpened}
        id="TezosDelegateSendWarning"
        desc={<Trans i18nKey="delegation.delegationSendWarnDesc" />}
      />
      <SendActionDefault {...rest} onPress={onPressDecorated} />
    </>
  );
};

const ReceiveAction = ({ onPress, account, ...rest }) => {
  const [isOpened, setOpened] = useState(false);
  const delegation = useDelegation(account);
  const receiveShouldWarnDelegation =
    delegation && delegation.receiveShouldWarnDelegation;

  const onPressDecorated = useCallback(() => {
    if (!isOpened && receiveShouldWarnDelegation) {
      setOpened(true);
    } else {
      if (isOpened) setOpened(false);
      onPress();
    }
  }, [isOpened, receiveShouldWarnDelegation, onPress]);

  const onClose = useCallback(() => {
    setOpened(false);
  }, []);

  return (
    <>
      <InfoModal
        withCancel
        onContinue={onPressDecorated}
        onClose={onClose}
        isOpened={isOpened}
        id="TezosDelegateReceiveWarning"
        desc={<Trans i18nKey="delegation.delegationReceiveWarnDesc" />}
      />
      <ReceiveActionDefault {...rest} onPress={onPressDecorated} />
    </>
  );
};

export default {
  SendAction,
  ReceiveAction,
};
