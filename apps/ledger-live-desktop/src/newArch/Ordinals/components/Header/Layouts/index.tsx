import React from "react";
import { Dropdown, Flex } from "@ledgerhq/react-ui";

type Props = {
  layoutOptions: {
    grid: {
      value: string;
      label: any;
    };
    list: {
      value: string;
      label: any;
    };
  };
  changeLayout: (layoutSelected: any) => void;
  layout: string;
};

const Layouts = ({ layoutOptions, changeLayout, layout }: Props) => {
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
