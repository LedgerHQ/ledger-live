import React from "react";
import { Dropdown, Flex } from "@ledgerhq/react-ui";
import useMenuLayouts from "../../../hooks/useMenuLayouts";

type Props = {};

const Layouts = ({}: Props) => {
  const { layoutOptions, changeLayout, layout } = useMenuLayouts();

  return (
    <Flex>
      <Dropdown
        label=""
        value={layoutOptions[layout]}
        options={Object.values(layoutOptions)}
        onChange={changeLayout}
        // styles={styles}
      />
    </Flex>
  );
};

export default Layouts;
