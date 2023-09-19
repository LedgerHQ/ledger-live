import { Box, Flex } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import IconCross from "~/renderer/icons/Cross";

const TouchButton = styled.button`
  border: none;
  background-color: rgba(0, 0, 0, 0);
  display: inline-flex;
  max-height: 100%;
  -webkit-app-region: no-drag;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  color: ${p => p.theme.colors.palette.text.shade80};
  transition: filter 150ms ease-out;
  cursor: pointer;

  :hover {
    filter: opacity(0.8);
  }
  :active {
    filter: opacity(0.5);
  }
`;

type Props = {
  onRequestClose: () => void;
};
const Header = ({ onRequestClose }: Props) => {
  const blocked = useDeviceBlocked();
  return (
    <Flex padding={8}>
      <Flex flex={1} />
      {blocked ? (
        <Box height={16}></Box>
      ) : (
        <TouchButton onClick={onRequestClose} data-test-id="drawer-close-button">
          <IconCross size={16} />
        </TouchButton>
      )}
    </Flex>
  );
};

export default Header;
