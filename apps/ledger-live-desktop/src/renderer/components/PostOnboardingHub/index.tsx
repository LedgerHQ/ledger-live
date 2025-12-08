import React, { useEffect, useMemo } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingActionRow from "./PostOnboardingActionRow";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { setHasRedirectedToPostOnboarding } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/lib-es/store";
import { accountsSelector } from "~/renderer/reducers/accounts";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const accounts = useSelector(accountsSelector);

  const postOnboardingRows = useMemo(
    () =>
      actionsState.map((action, index) => (
        <React.Fragment key={index}>
          <PostOnboardingActionRow
            {...action}
            deviceModelId={deviceModelId}
            isLedgerSyncActive={isLedgerSyncActive}
            accounts={accounts}
          />
        </React.Fragment>
      )),
    [actionsState, deviceModelId, isLedgerSyncActive, accounts],
  );

  useEffect(() => {
    dispatch(setHasRedirectedToPostOnboarding(true));
  }, [dispatch]);

  return (
    <Flex flexDirection="column" justifyContent="center">
      {postOnboardingRows}
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHub);
