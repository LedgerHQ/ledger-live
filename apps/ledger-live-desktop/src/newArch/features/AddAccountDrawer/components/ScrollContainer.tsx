import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import { Flex } from "@ledgerhq/react-ui/index";
import { FC } from "react";
import styled from "styled-components";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props extends Omit<FlexBoxProps, "marginBottom" | "paddingBottom"> {}

export const ScrollContainer: FC<Props> = styled(Flex)<Props>(_ => {
  const blurEffectHeight = 100;
  return `
    flex: 1;
    flex-direction: column;
    overflow: auto;
    scrollbar-width: none;
    margin-bottom: -${blurEffectHeight}px;
    padding-bottom: ${blurEffectHeight}px;
    mask-image: linear-gradient(
      to bottom,
      black calc(100% - ${blurEffectHeight * 1.7}px),
      transparent calc(100% - ${blurEffectHeight * 0.15}px),
      transparent 100%
    );
  `;
});
