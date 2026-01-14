import React, { useCallback, memo } from "react";
import { Trans } from "react-i18next";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import Box from "~/renderer/components/Box";
import BoldToggle from "~/renderer/components/BoldToggle";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconAngleUp from "~/renderer/icons/AngleUp";
import { SortOptions } from "@ledgerhq/live-common/apps/filtering";

type Props = {
  onSortChange: (sort: SortOptions) => void;
  sort: SortOptions;
};
const Sort = ({ onSortChange, sort }: Props) => {
  const sortItems: Array<{
    key: string;
    sort: SortOptions;
    label: React.JSX.Element;
  }> = [
    {
      key: "marketcap_desc",
      sort: {
        type: "marketcap" as const,
        order: "desc" as const,
      },
      label: <Trans i18nKey="manager.applist.sort.marketcap_desc" />,
    },
    {
      key: "name_asc",
      sort: {
        type: "name" as const,
        order: "asc" as const,
      },
      label: <Trans i18nKey="manager.applist.sort.name_asc" />,
    },
    {
      key: "name_desc",
      sort: {
        type: "name" as const,
        order: "desc" as const,
      },
      label: <Trans i18nKey="manager.applist.sort.name_desc" />,
    },
  ];
  const onSortChangeWrapper = useCallback(
    (item: (typeof sortItems)[number]) => {
      if (!item) {
        return;
      }
      onSortChange(item.sort);
    },
    [onSortChange],
  );

  const renderItem = useCallback(
    ({ item, isActive }: { item: (typeof sortItems)[number]; isActive: boolean }) => (
      <DropDownItem
        alignItems="center"
        justifyContent="flex-start"
        horizontal
        isActive={isActive}
        flow={2}
      >
        <Box grow alignItems="flex-start">
          <BoldToggle isBold={isActive}>{item.label}</BoldToggle>
        </Box>
      </DropDownItem>
    ),
    [],
  );
  const key = `${sort.type}_${sort.order}`;
  return (
    <DropDownSelector
      items={sortItems}
      renderItem={renderItem}
      onChange={onSortChangeWrapper}
      value={sortItems.find(item => item.key === key)}
      controlled
    >
      {({ isOpen, value }) =>
        value ? (
          <Box horizontal flow={1}>
            <Text color="neutral.c70" ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey="manager.applist.sort.title" />
            </Text>
            <Box
              alignItems="center"
              color="wallet"
              ff="Inter|SemiBold"
              flow={1}
              fontSize={4}
              horizontal
            >
              <Text color="wallet">
                <Trans i18nKey={`manager.applist.sort.${value.key}`} />
              </Text>
              {isOpen ? <IconAngleUp size={16} /> : <IconAngleDown size={16} />}
            </Box>
          </Box>
        ) : null
      }
    </DropDownSelector>
  );
};
export default memo<Props>(Sort);
