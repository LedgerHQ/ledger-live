import React from "react";
import styled from "styled-components";
import IconArrowDown from "~/renderer/icons/ArrowDown";

interface Props {
  icon?: React.ReactNode;
}

const Separator = styled.div`
  display: flex;
  align-items: center;
  & > div {
    flex: 1;
    height: 1px;
    background: ${p => p.theme.colors.neutral.c40};
    &:nth-of-type(2) {
      color: ${p => p.theme.colors.primary.c80};
      flex: unset;
      display: flex;
      align-items: center;
      height: 36px;
      width: 36px;
      border-radius: 36px;
      background: transparent;
      justify-content: center;
      border: 1px solid ${p => p.theme.colors.neutral.c40};
    }
  }
`;
const StepRecipientSeparator = ({ icon = <IconArrowDown size={16} /> }: Props) => (
  <Separator>
    <div />
    <div>{icon}</div>
    <div />
  </Separator>
);
export default StepRecipientSeparator;
