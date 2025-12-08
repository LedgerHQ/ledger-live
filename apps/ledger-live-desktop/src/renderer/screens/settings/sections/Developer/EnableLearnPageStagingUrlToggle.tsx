import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { enableLearnPageStagingUrlSelector } from "~/renderer/reducers/settings";
import { setEnableLearnPageStagingUrl } from "~/renderer/actions/settings";
import { Switch } from "@ledgerhq/ldls-ui-react";
const EnableLearnPageStagingUrl = () => {
  const dispatch = useDispatch();
  const enableLearnPageStagingUrl = useSelector(enableLearnPageStagingUrlSelector);
  const onSetEnablePlatformDevTools = useCallback(
    (checked: boolean) => dispatch(setEnableLearnPageStagingUrl(checked)),
    [dispatch],
  );
  return (
    <>
      <Switch
        selected={!!enableLearnPageStagingUrl}
        onChange={onSetEnablePlatformDevTools}
        data-testid="settings-enable-earn-page-staging-url"
      />
    </>
  );
};
export default EnableLearnPageStagingUrl;
