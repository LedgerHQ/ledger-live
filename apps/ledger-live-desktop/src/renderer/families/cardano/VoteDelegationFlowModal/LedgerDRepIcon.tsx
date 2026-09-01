import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

const IconContainer = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  color: ${p => p.theme.colors.primary.c80};
`;

const CardanoDRepIcon = ({ dRep }: { dRep: DRep }) => {
  return (
    <IconContainer>
      <FirstLetterIcon label={dRep.meta?.givenName || dRep.hex} />
    </IconContainer>
  );
};

export default CardanoDRepIcon;
