import { Icons } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
const NotifBadge = styled.div`
  height: 20px;
  min-width: 20px;
  text-align: center;
  line-height: 16px;
  border-radius: 20px;
  background-color: ${p => p.theme.colors.alertRed};
  color: ${p => p.theme.colors.palette.primary.contrastText};
  padding: 0 2px;
  position: absolute;
  top: -9px;
  right: -10px;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid ${p => p.theme.colors.palette.background.default};
  box-sizing: border-box;
`;
const BellIcon = ({ size, count }: { size: number; count?: number }) => {
  return (
    <Container>
      <Icons.NotificationsMedium size={size} />
      {count && count > 0 ? <NotifBadge>{count}</NotifBadge> : null}
    </Container>
  );
};
export default BellIcon;
