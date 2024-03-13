import React from "react";
import { Dropdown, Flex } from "@ledgerhq/react-ui";
import { Layout, LayoutKey } from "~/newArch/Ordinals/types/Layouts";

type Props = {
  layoutOptions: Record<LayoutKey, Layout>;
  changeLayout: (layoutSelected: Layout) => void;
  layout: LayoutKey;
};

const styles = {
  // TODO: implement this behavior in the @ledger/ui lib, here we are just overriding the style from the design system lib to have the MENU right aligned
  menu: (styles: unknown) => ({
    ...(styles as object),
    backgroundColor: "transparent",
    width: "fit-content",
  }),

  // TODO: implement this behavior in the @ledger/ui lib, here we are just overriding the style from the design system lib to have the VALUE right aligned
  valueContainer: (styles: unknown) => ({ ...(styles as object) }),
  option: () => ({
    flex: 1,
    alignSelf: "center" as const,
    textAlign: "center" as const,
  }),
};

const Layouts = ({ layoutOptions, changeLayout, layout }: Props) => {
  return (
    <Flex>
      <Dropdown
        label=""
        value={layoutOptions[layout]}
        options={Object.values(layoutOptions)}
        onChange={changeLayout}
        styles={styles}
      />
    </Flex>
  );
};

export default Layouts;
