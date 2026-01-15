import { Icons } from "@ledgerhq/react-ui/index";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import styled from "styled-components";

type Props = {
  onBackClick?: () => void;
};

export const BackButtonArrow = ({ onBackClick }: Props) => {
  const handleBackClick = onBackClick ? () => onBackClick() : undefined;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="mad-back-button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeIn" } }}
        exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      >
        <BackButton onClick={handleBackClick} data-testid="mad-back-button">
          <Icons.ArrowLeft />
        </BackButton>
      </motion.div>
    </AnimatePresence>
  );
};

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
`;
