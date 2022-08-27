// @flow
import type { Unit } from "@ledgerhq/live-common/types/index";
import React from "react";
import styled from "styled-components";
import VoteRow from "./VoteRow";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import Ellipsis from "~/renderer/components/Ellipsis";

type Props = {
  vote: any,
  active?: boolean,
  onClick?: (v: any) => void,
  disableHover?: boolean,
  unit: Unit,
};

const DesciptionText = styled(Text).attrs(() => ({}))`
  font-size: 11px;
  flex-shrink: 1;
`;

const generateNameWithHip = vote => {
  if (vote.name.includes("HIP")) {
    return vote.name;
  }

  if (vote.tags.primary.includes("HIP")) {
    return `${vote.tags.primary}: ${vote.name}`;
  }

  const matches = vote.description.match(/([HIP]{3})([ .-]?).*?(?=\s)/g);
  if (matches) {
    return `${matches[0]}: ${vote.name}`;
  }

  return vote.name;
};

function HIPRow({ vote, active, onClick, unit, disableHover }: Props) {
  return (
    <StyledHIPRow
      onClick={onClick}
      key={vote.id}
      vote={vote}
      title={generateNameWithHip(vote)}
      unit={unit}
      subtitle={
        <>
          {active ? (
            <DesciptionText>{vote.description}</DesciptionText>
          ) : (
            <Ellipsis>{vote.description}</Ellipsis>
          )}
        </>
      }
    ></StyledHIPRow>
  );
}

const StyledHIPRow: ThemedComponent<{ disableHover: boolean }> = styled(VoteRow)`
  border-color: transparent;
  margin-bottom: 0;
  ${p => (p.disableHover ? "&:hover { border-color: transparent; }" : "")}
`;

export default HIPRow;
