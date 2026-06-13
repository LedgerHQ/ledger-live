import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { showContactsTestPanelSelector } from "~/renderer/reducers/settings";
import { setShowContactsTestPanel } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";

const ContactsTestPanelToggle = () => {
  const dispatch = useDispatch();
  const showContactsTestPanel = useSelector(showContactsTestPanelSelector);
  const onSetShowContactsTestPanel = useCallback(
    (checked: boolean) => dispatch(setShowContactsTestPanel(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="ContactsTestPanel" />
      <Switch
        selected={showContactsTestPanel}
        onChange={onSetShowContactsTestPanel}
        data-testid="settings-contacts-test-panel"
      />
    </>
  );
};
export default ContactsTestPanelToggle;
