import React from "react";
import styled from "styled-components";
import { Icons } from "@ledgerhq/react-ui/index";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

type Props = {
  onRequestClose: (mouseEvent: React.MouseEvent<Element, MouseEvent>) => void;
};

export const CloseButton = ({ onRequestClose }: Props) => {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key="mad-back-button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeIn" } }}
        exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      >
        <CloseIconWrapper onClick={onRequestClose} data-testid="mad-close-button">
          <Icons.Close size="XS" />
        </CloseIconWrapper>
      </motion.div>
    </AnimatePresence>
  );
};

const CloseIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 1000;
  background-color: red;
  border-radius: 1000px;
  background-color: ${p => p.theme.colors.palette.opacityDefault.c05};
`;
