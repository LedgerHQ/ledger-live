import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import DropDown, { DropDownItem, DropDownItemType } from "~/renderer/components/DropDownSelector";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import ChevronRight from "~/renderer/icons/ChevronRight";
type Item = {
  key?: string;
  label: React.ReactNode;
  disabled?: boolean;
  content?: React.ReactNode;
};

const ManageDropDownItem = ({ item, isActive }: { item: Item; isActive: boolean }) => {
  return (
    <>
      <ToolTip
        content={item.content}
        containerStyle={{
          width: "100%",
        }}
      >
        <DropDownItem disabled={item.disabled} isActive={isActive}>
          <Box horizontal alignItems="center" justifyContent="center">
            <Text ff="Inter|SemiBold">{item.label}</Text>
          </Box>
        </DropDownItem>
      </ToolTip>
    </>
  );
};
const ManageDropDown = ({
  actions,
  onSelect,
}: {
  actions: Array<DropDownItemType>;
  onSelect: (action: DropDownItemType) => void;
}) => {
  return (
    <DropDown items={actions} renderItem={ManageDropDownItem} onChange={onSelect}>
      {() => {
        return (
          <Box horizontal alignItems="center">
            <Trans i18nKey="common.manage" />
            <div
              style={{
                transform: "rotate(90deg)",
              }}
            >
              <ChevronRight size={16} />
            </div>
          </Box>
        );
      }}
    </DropDown>
  );
};
export default ManageDropDown;
