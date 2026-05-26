import React from "react";
import styled from "styled-components";
import { CardanoAccount, CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import ContextMenu from "./ContextMenu";

type Props = {
  delegation: CardanoDelegation;
  account: CardanoAccount;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 20px;
  opacity: 1;
  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }
`;

const CTA = styled.div`
  flex: 0.5;
  display: flex;
  justify-content: flex-end;
`;

const Value = styled.div`
  width: 90%;
  box-sizing: border-box;
  justify-content: flex-start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Row = ({ account, delegation }: Props) => {
  const { t } = useTranslation();
  let name = "";
  if (delegation && delegation.dRepHex) {
    if (delegation.dRepHex === "2") {
      name = t("voteDelegation.options.alwaysAbstain");
    } else if (delegation.dRepHex === "3") {
      name = t("voteDelegation.options.alwaysNoConfidence");
    } else {
      name = delegation.dRepHex;
    }
  }
  return (
    <Wrapper>
      <Value>
        <Ellipsis fontSize={3} color="neutral.c80">
          <Text ff="Inter|SemiBold">{name}</Text>
        </Ellipsis>
      </Value>

      <CTA>
        <ContextMenu account={account} />
      </CTA>
    </Wrapper>
  );
};

export default Row;
