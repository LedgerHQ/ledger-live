import React, { PureComponent, useCallback, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { useBridgeSync, useAccountSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { AccountLike } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import { Rotating } from "~/renderer/components/Spinner";
import Tooltip from "~/renderer/components/Tooltip";
import TranslatedError from "~/renderer/components/TranslatedError";
import IconCheck from "~/renderer/icons/Check";
import IconSyncServer from "~/renderer/icons/SyncServer";
import IconPending from "~/renderer/icons/Clock";
import IconError from "~/renderer/icons/Error";
import IconLoader from "~/renderer/icons/Loader";
import { isUpToDateAccountSelector } from "~/renderer/reducers/accounts";
import { colors } from "~/renderer/styles/theme";
import useEnv from "~/renderer/hooks/useEnv";
const mapStateToProps = createStructuredSelector({
  isUpToDateAccount: isUpToDateAccountSelector,
});

class StatusQueued extends PureComponent<{
  onClick: (a: any) => void;
}> {
  render() {
    const { onClick } = this.props;
    return (
      <Tooltip content={<Trans i18nKey="common.sync.outdated" />}>
        <Box onClick={onClick}>
          <IconPending color={colors.grey} size={16} />
        </Box>
      </Tooltip>
    );
  }
}
class StatusSynchronizing extends PureComponent<{
  onClick: (a: any) => void;
}> {
  render() {
    const { onClick } = this.props;
    return (
      <Tooltip content={<Trans i18nKey="common.sync.syncing" />}>
        <Box onClick={onClick}>
          <Rotating onClick={onClick} size={16}>
            <IconLoader color={colors.grey} size={16} />
          </Rotating>
        </Box>
      </Tooltip>
    );
  }
}
class StatusUpToDate extends PureComponent<{
  showSatStackIcon?: boolean;
  onClick: (a: any) => void;
}> {
  render() {
    const { showSatStackIcon, onClick } = this.props;
    return (
      <Tooltip content={<Trans i18nKey="common.sync.upToDate" />}>
        <Box onClick={onClick}>
          {showSatStackIcon ? (
            <IconSyncServer onClick={onClick} color={colors.positiveGreen} size={16} />
          ) : (
            <IconCheck onClick={onClick} color={colors.positiveGreen} size={16} />
          )}
        </Box>
      </Tooltip>
    );
  }
}
class StatusError extends PureComponent<{
  onClick: (a: any) => void;
  error: Error | undefined | null;
}> {
  render() {
    const { onClick, error } = this.props;
    return (
      <Tooltip
        tooltipBg="alertRed"
        content={
          <Box
            style={{
              maxWidth: 250,
            }}
          >
            <TranslatedError error={error} />
          </Box>
        }
      >
        <Box onClick={onClick}>
          <IconError onClick={onClick} color={colors.alertRed} size={16} />
        </Box>
      </Tooltip>
    );
  }
}

type OwnProps = {
  accountId: string;
  account: AccountLike;
};
type Props = OwnProps & {
  isUpToDateAccount: boolean;
};
const AccountSyncStatusIndicator = ({ accountId, account, isUpToDateAccount }: Props) => {
  const { pending, error } = useAccountSyncState({
    accountId,
  });
  const sync = useBridgeSync();
  const [userAction, setUserAction] = useState(false);
  const timeout = useRef(null);
  const satStackAlreadyConfigured = useEnv("SATSTACK");
  const currency = getAccountCurrency(account);
  const showSatStackIcon = satStackAlreadyConfigured && currency.id === "bitcoin";
  const onClick = useCallback(
    e => {
      e.stopPropagation();
      sync({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: 10,
        reason: "user-click-one",
      });
      setUserAction(true);
      // a user action is kept in memory for a short time (which will correspond to a spinner time)
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setUserAction(false), 1000);
    },
    [sync, accountId],
  );

  // at unmount, clear all timeouts
  useEffect(() => {
    clearTimeout(timeout.current);
  }, []);

  // We optimistically will show things are up to date even if it's actually synchronizing
  // in order to "debounce" the UI and don't make it blinks each time a sync happens
  // only when user did the account we will show the true state
  if ((pending && !isUpToDateAccount) || userAction) {
    return <StatusSynchronizing onClick={onClick} />;
  }
  if (error) {
    return <StatusError onClick={onClick} error={error} />;
  }
  if (isUpToDateAccount) {
    return <StatusUpToDate showSatStackIcon={showSatStackIcon} onClick={onClick} />;
  }
  return <StatusQueued onClick={onClick} />;
};
const m: React$ComponentType<OwnProps> = connect(mapStateToProps)(AccountSyncStatusIndicator);
export default m;
