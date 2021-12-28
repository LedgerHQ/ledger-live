import React from "react";
import { storiesOf } from "../../storiesOf";
import { TipList } from "../../../../src";
import { select } from "@storybook/addon-knobs";

const TipListStory = () => {
  return (
    <TipList
      items={[
        {
          title: "Always choose a PIN code by yourself.",
          isPositive: true,
        },
        {
          title: "Always enter your PIN code without being observed.",
          isPositive: true,
        },
        {
          title: "You can change your PIN code if needed. ",
          isPositive: true,
        },
        {
          title: "Never use an easy PIN code like 0000, 123456, or 55555555.",
          isPositive: false,
        },
        {
          title: "Never share your PIN code with someone else.",
          isPositive: false,
        },
        {
          title: "Never use a PIN code you did not choose by yourself.",
          isPositive: false,
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

storiesOf((story) => story("Layout/List", module).add("TipList", () => <TipListStory />));
