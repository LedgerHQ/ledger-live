import React from "react";
import { animated, useSpring } from "react-spring";
import { useTheme } from "styled-components";
import { ItemStatus } from "./types";

const defaultBulletStyle = {
  height: "6px",
  borderRadius: "1000px",
  marginRight: "4px",
  opacity: 1,
};

const useBulletStyles = () => {
  const { colors } = useTheme();

  const BulletStyle: {
    [key in ItemStatus]: {
      width: string;
      height: string;
      backgroundColor: string;
      borderRadius: string;
      opacity?: number;
      marginRight: string;
    };
  } = {
    [ItemStatus.active]: {
      ...defaultBulletStyle,
      width: "16px",
      backgroundColor: colors.opacityDefault.c80,
    },
    [ItemStatus.nearby]: {
      ...defaultBulletStyle,
      width: "8px",
      backgroundColor: colors.opacityDefault.c30,
    },
    [ItemStatus.far]: {
      ...defaultBulletStyle,
      width: "4px",
      backgroundColor: colors.opacityDefault.c10,
    },
    [ItemStatus.none]: {
      ...defaultBulletStyle,
      width: "0px",
      opacity: 0,
      backgroundColor: colors.opacityDefault.c10,
      marginRight: "0px",
    },
  };

  return BulletStyle;
};

const Bullet = ({ type }: { type: ItemStatus }) => {
  return <animated.div style={useSpring(useBulletStyles()[type])} />;
};

export default Bullet;
