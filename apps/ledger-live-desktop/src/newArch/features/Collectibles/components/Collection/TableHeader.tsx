import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { TableHeader as HeaderContainer } from "~/renderer/components/TableContainer";
import { TableHeaderProps as Props } from "LLD/features/Collectibles/types/Collection";

const TableHeader: React.FC<Props> = ({ titleKey, actions }) => {
  const { t } = useTranslation();
  return (
    <HeaderContainer title={t(titleKey)}>
      <Flex columnGap={12} alignItems={"center"}>
        {actions
          ?.filter(action => !action.hidden)
          .map(({ element, action }, index) => (
            <div key={index} onClick={action}>
              {element}
            </div>
          ))}
      </Flex>
    </HeaderContainer>
  );
};

export default TableHeader;
