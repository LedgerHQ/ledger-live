import React, { PureComponent } from "react";
import styled from "styled-components";
import { Operation } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";

export const splitAddress = (value: string): { left: string; right: string } => {
  let left, right;
  if (value.includes(".")) {
    const parts = value.split(".");
    left = parts[0] + ".";
    right = parts.slice(1).join(".");
  } else {
    const third = Math.round(value.length / 3);
    left = value.slice(0, third);
    right = value.slice(third, value.length);
  }
  return { left, right };
};

export const SplitAddress = ({
  value,
  color,
  ff,
  fontSize,
}: {
  value: string;
  color?: string;
  ff?: string;
  fontSize?: number;
}) => {
  if (!value) {
    return <Box />;
  }
  const boxProps = {
    color,
    ff,
    fontSize,
  };

  const { left, right } = splitAddress(value);

  return (
    <Box horizontal {...boxProps}>
      <Left>{left}</Left>
      <Right>{right}</Right>
    </Box>
  );
};
export const Address = ({ value }: { value: string }) => (
  <SplitAddress value={value} color="palette.text.shade80" ff="Inter" fontSize={3} />
);
const Left = styled.div`
  overflow: hidden;
  max-width: calc(100% - 20px);
  white-space: nowrap;
  font-kerning: none;
  letter-spacing: 0px;
`;
const Right = styled.div`
  display: inline-block;
  flex-shrink: 1;
  direction: rtl;
  text-indent: 0.6ex;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-kerning: none;
  min-width: 3ex;
  letter-spacing: 0px;
`;
export const Cell = styled(Box).attrs<{
  px?: number;
}>(p => ({
  px: p.px === 0 ? p.px : p.px || 4,
  horizontal: true,
  alignItems: "center",
}))`
  width: 150px;
  flex-grow: 1;
  flex-shrink: 1;
  display: block;
`;
type Props = {
  operation: Operation;
};
const showSender = (o: Operation) => o.senders[0];
const showRecipient = (o: Operation) => o.recipients[0];
const showNothing = () => null;
const perOperationType = {
  IN: showSender,
  REVEAL: showSender,
  REWARD_PAYOUT: showSender,
  NFT_IN: showNothing,
  NFT_OUT: showNothing,
  _: showRecipient,
};
class AddressCell extends PureComponent<Props> {
  render() {
    const { operation } = this.props;
    const lense =
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      perOperationType[operation.type as keyof typeof perOperationType] || perOperationType._;
    const value = lense(operation);
    return value ? (
      <Cell>
        <Address value={value} />
      </Cell>
    ) : (
      <Box flex={1} />
    );
  }
}
export default AddressCell;
