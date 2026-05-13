import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { setContactsAlpha } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";

const ContactsAlphaToggle = () => {
  const dispatch = useDispatch();
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const onSetContactsAlpha = useCallback(
    (checked: boolean) => dispatch(setContactsAlpha(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="ContactsAlpha" />
      <Switch
        selected={contactsAlpha}
        onChange={onSetContactsAlpha}
        data-testid="settings-contacts-alpha"
      />
    </>
  );
};
export default ContactsAlphaToggle;
