import React from "react";
import { Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";

const TempAssetBadge = ({ icon: _icon }: { icon?: string }) => (
  // TODO: To be replaced with LIVE-18221
  <div style={{ display: "flex", alignItems: "center" }} data-testid="address-icon">
    <span
      style={{
        height: 20,
        width: 20,
        borderRadius: 20,
        backgroundColor: "grey",
        display: "inline-block",
      }}
    />
  </div>
);

const Wrapper = styled.div`
  ${withTokens("colors-content-subdued-default-default")}

  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const Address = ({
  address,
  showIcon,
  icon,
}: {
  address: string;
  showIcon: boolean;
  icon?: string;
}) => {
  // TODO change to the ID of the icon
  return (
    <Wrapper>
      <Text
        style={{
          marginRight: 6,
          fontSize: 12,
          color: "var(--colors-content-subdued-default-default)",
        }}
      >
        {address}
      </Text>
      {showIcon && <TempAssetBadge icon={icon} />}
    </Wrapper>
  );
};
