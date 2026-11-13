import React, { useCallback, memo } from "react";
import { Trans } from "react-i18next";
import type { AppDeveloperFilter } from "@ledgerhq/live-common/apps/developer";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconAngleUp from "~/renderer/icons/AngleUp";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box";
import BoldToggle from "~/renderer/components/BoldToggle";
import Text from "~/renderer/components/Text";

type Props = {
  onDeveloperChange: (key: AppDeveloperFilter) => void;
  developer: AppDeveloperFilter;
};

type DeveloperItem = {
  key: AppDeveloperFilter;
  label: React.JSX.Element;
};

const developerItems: DeveloperItem[] = [
  { key: "all", label: <Trans i18nKey="manager.applist.developerFilter.all" /> },
  { key: "ledger", label: <Trans i18nKey="manager.applist.developerFilter.ledger" /> },
  { key: "community", label: <Trans i18nKey="manager.applist.developerFilter.community" /> },
];

/** Developer filter of the app catalog: All, Ledger apps or community apps. */
const DeveloperFilter = ({ onDeveloperChange, developer }: Props) => {
  const onChange = useCallback(
    (item: DeveloperItem | null | undefined) => {
      if (!item) return;
      onDeveloperChange(item.key);
    },
    [onDeveloperChange],
  );

  const renderItem = useCallback(
    ({ item, isActive }: { item: DeveloperItem; isActive: boolean }) => (
      <DropDownItem
        alignItems="center"
        justifyContent="flex-start"
        horizontal
        isActive={isActive}
        flow={2}
        data-testid={`manager-developer-filter-option-${item.key}`}
      >
        <Box grow alignItems="flex-start">
          <BoldToggle isBold={isActive}>{item.label}</BoldToggle>
        </Box>
      </DropDownItem>
    ),
    [],
  );

  const value = developerItems.find(item => item.key === developer) ?? developerItems[0];

  return (
    <DropDownSelector
      items={developerItems}
      renderItem={renderItem}
      onChange={onChange}
      value={value}
      controlled
    >
      {({ isOpen }) => (
        <Box horizontal flow={1} data-testid="manager-developer-filter-button">
          <Text color="neutral.c70" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey="manager.applist.developerFilter.title" />
          </Text>
          <Box
            alignItems="center"
            color="wallet"
            ff="Inter|SemiBold"
            flow={1}
            fontSize={4}
            horizontal
          >
            <Text color="wallet">{value.label}</Text>
            {isOpen ? <IconAngleUp size={16} /> : <IconAngleDown size={16} />}
          </Box>
        </Box>
      )}
    </DropDownSelector>
  );
};

export default memo<Props>(DeveloperFilter);
