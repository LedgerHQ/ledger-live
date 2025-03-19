import { Divider, Flex, Text } from "@ledgerhq/react-ui/index";
import React, { useState } from "react";
import CollapsibleCard from "~/renderer/components/CollapsibleCard";
import FadeInOutBox from "~/renderer/components/FadeInOutBox";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { Badge } from "./Badge";

type Props = {
  title: string;
  badge?: number;
  body: React.ReactNode;
  visible: boolean;
};

export function Collapsible({ title, badge, body, visible }: Props) {
  const [open, setIsOpen] = useState<boolean>(false);

  return (
    <FadeInOutBox in={visible} mt={4}>
      <CollapsibleCard
        bg="opacityDefault.c10"
        header={
          <Header>
            <Text ff="Inter|SemiBold" fontSize={4} color="primary.c80" mr={2}>
              <Trans i18nKey={title} count={badge} />
            </Text>
            <Badge ff="Inter|Bold" fontSize={3}>
              {badge}
            </Badge>
          </Header>
        }
        open={open}
        onOpen={setIsOpen}
      >
        <Divider />
        {body}
      </CollapsibleCard>
    </FadeInOutBox>
  );
}

const Header = styled(Flex)`
  flex-direction: row;
  align-items: center;
  padding: 10px 20px 10px 0px;
  height: 48px;
  box-sizing: content-box;
`;
