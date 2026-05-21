import React, { useCallback, useState } from "react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { GenericAwarenessModalDevToolContent } from "./GenericAwarenessModalDevToolContent";
import { GENERIC_AWARENESS_MODAL_DEV_TOOL_COPY as copy } from "./copy";

const GenericAwarenessModalDevTool = () => {
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(prev => !prev);
  }, []);

  return (
    <Row
      title={copy.title}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<GenericAwarenessModalDevToolContent expanded={contentExpanded} />}
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? copy.hide : copy.show}
      </Button>
    </Row>
  );
};

export default GenericAwarenessModalDevTool;
