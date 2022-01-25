import React from "react";
import { storiesOf } from "../../storiesOf";
import { NumberedList } from "../../../../src";
import { select } from "@storybook/addon-knobs";

const NumberedListStory = () => {
  return (
    <NumberedList
      items={[
        {
          description: "Get a new hardware wallet.",
        },
        {
          description: "Select “Restore recovery phrase on a new device” on the Ledger app.",
          number: 42,
        },
        {
          description:
            "Enter your recovery phrase on your new device to restore access to your crypto.",
        },
      ]}
      itemContainerProps={{
        alignItems: select(
          "Align items",
          ["flex-start", "flex-end", "center", "baseline", "stretch"],
          "center",
          "Layout",
        ),
      }}
    />
  );
};

storiesOf((story) => story("Layout/List", module).add("NumberedList", () => <NumberedListStory />));
