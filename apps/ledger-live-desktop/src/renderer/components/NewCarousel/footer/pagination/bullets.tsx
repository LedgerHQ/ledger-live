import React from "react";
import { ItemStatus } from "./types";
import { useTheme } from "styled-components";
import { useSpring, animated } from "react-spring";

const useBulletStyles = () => {
  const { colors } = useTheme();

  const BulletStyle: {
    [key in ItemStatus]: {
      width: string;
      height: string;
      backgroundColor: string;
      borderRadius: string;
    };
  } = {
    [ItemStatus.active]: {
      width: "16px",
      height: "6px",
      backgroundColor: colors.opacityDefault.c80,
      borderRadius: "1000px",
    },
    [ItemStatus.nearby]: {
      width: "8px",
      height: "6px",
      backgroundColor: colors.opacityDefault.c30,
      borderRadius: "1000px",
    },
    [ItemStatus.far]: {
      width: "4px",
      height: "6px",
      backgroundColor: colors.opacityDefault.c10,
      borderRadius: "1000px",
    },
    [ItemStatus.none]: {
      width: "0px",
      height: "6px",
      backgroundColor: colors.opacityDefault.c10,
      borderRadius: "1000px",
    },
  };

  return BulletStyle;
};

const Bullet = ({ type }: { type: ItemStatus }) => {
  const bulletStyles = useBulletStyles();

  const props = useSpring({
    width: bulletStyles[type].width,
    height: bulletStyles[type].height,
    backgroundColor: bulletStyles[type].backgroundColor,
    borderRadius: bulletStyles[type].borderRadius,
  });

  return <animated.div style={props} />;
};

export default Bullet;
