import React from "react";
import Tooltip from "~/renderer/components/Tooltip";
import { mappingKeysWithIconAndName } from "LLD/features/Collectibles/Ordinals/components/Icons";
import { useTranslation } from "react-i18next";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";

type ToolTipProps = {
  content: MappingKeys;
  children: React.ReactNode;
};

const RareSatToolTip: React.FC<ToolTipProps> = ({ content, children }) => {
  const { t } = useTranslation();

  const tooltipContent = mappingKeysWithIconAndName[content]?.descriptionTranslationKey || content;
  return <Tooltip content={t(tooltipContent)}>{children}</Tooltip>;
};

export default RareSatToolTip;
