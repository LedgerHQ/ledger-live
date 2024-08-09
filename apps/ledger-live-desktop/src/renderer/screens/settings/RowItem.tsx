import React, { useCallback } from "react";
import { openURL } from "~/renderer/linking";
import IconExternalLink from "~/renderer/icons/ExternalLink";
import { Tabbable } from "~/renderer/components/Box";
import { SettingsSectionRow } from "./SettingsSection";
type Props = {
  url: string;
  title: string;
  desc: string;
  dataTestId?: string;
};
const AboutRowItem = ({ url, title, desc, dataTestId }: Props) => {
  const onClick = useCallback(() => openURL(url), [url]);
  return (
    <SettingsSectionRow title={title} desc={desc} dataTestId={dataTestId}>
      <Tabbable
        p={2}
        borderRadius={1}
        onClick={onClick}
        style={{
          cursor: "pointer",
        }}
      >
        <IconExternalLink size={16} dataTestId={`${dataTestId}-link`} />
      </Tabbable>
    </SettingsSectionRow>
  );
};
export default AboutRowItem;
