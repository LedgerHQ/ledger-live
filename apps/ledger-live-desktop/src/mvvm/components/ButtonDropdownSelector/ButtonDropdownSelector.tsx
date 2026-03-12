import React from "react";
import { Menu, MenuTrigger, MenuContent, MenuCheckboxItem, Button } from "@ledgerhq/lumen-ui-react";
import type { ButtonDropdownItem } from "./types";
import ButtonDropdownDefaultTrigger from "./ButtonDropdownDefaultTrigger";

const DEFAULT_WIDTH_PX = 160;

export type ButtonDropdownSelectorProps = {
  readonly items: ButtonDropdownItem[];
  readonly onChange: (value: ButtonDropdownItem) => void;
  readonly value: ButtonDropdownItem | null;
  readonly buttonId?: string;
};

function ButtonDropdownSelector({
  items = [],
  onChange,
  value,
  buttonId,
}: ButtonDropdownSelectorProps) {
  const widthStyle = `w-[${DEFAULT_WIDTH_PX}px] min-w-[${DEFAULT_WIDTH_PX}px]`;

  return (
    <Menu>
      <MenuTrigger asChild>
        <div className={widthStyle} id={buttonId}>
          <Button
            appearance="transparent"
            size="sm"
            className="flex w-full justify-between"
            aria-haspopup="listbox"
          >
            {value && <ButtonDropdownDefaultTrigger selectedOption={value} />}
          </Button>
        </div>
      </MenuTrigger>
      <MenuContent className={widthStyle} side="bottom" align="start">
        {items.map(item => (
          <MenuCheckboxItem
            key={item.key}
            id={buttonId ? `${buttonId}-${item.key}` : undefined}
            checked={!!(value && item.key === value.key)}
            onCheckedChange={checked => checked && !item.disabled && onChange(item)}
            disabled={item.disabled}
          >
            {item.label}
          </MenuCheckboxItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export default ButtonDropdownSelector;
