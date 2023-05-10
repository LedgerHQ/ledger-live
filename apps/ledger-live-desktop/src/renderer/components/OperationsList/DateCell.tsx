import React, { PureComponent, useEffect, useState } from "react";
import styled from "styled-components";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";
import Box from "~/renderer/components/Box";
import OperationDate from "./OperationDate";

const Cell = styled(Box).attrs(() => ({
  px: 3,
  horizontal: false,
}))<{
  compact?: boolean;
}>`
  width: auto;
  min-width: ${p => (p.compact ? 150 : 180)}px;
`;
type Props = {
  t: TFunction;
  operation: Operation;
  text?: string;
  compact?: boolean;
};
class DateCell extends PureComponent<Props> {
  static defaultProps = {
    withAccount: false,
  };
  state = {
    ordinals: "",
  };
  
  componentDidMount() {
    const {operation} = this.props;    
    const url = `https://ordapi.xyz/output/${operation.hash}:0`;
    fetch(url).then(response => response.json()).then(json => {
      if (json.inscriptions) {
        fetch(`https://ordapi.xyz${json.inscriptions}`).then(response2 => response2.json()).then(json2 => {
          // setOrdinals(`https://ordinals.com${json2.content}`);
          this.setState({ ordinals: `https://ordinals.com${json2.content}` });
        });
      }
    });
  }

  render() {
    const { t, operation, compact, text } = this.props;
    const ellipsis = {
      display: "block",
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
    };

    //const [ordinals, setOrdinals] = useState("");

    return (
      <Cell compact={compact}>
        <Box ff="Inter|SemiBold" fontSize={3} color="palette.text.shade80" style={ellipsis}>
          {
          this.state.ordinals.length>1 ? "Ordinal transfer" :
          text ||
            t(operation.hasFailed ? "operationDetails.failed" : `operation.type.${operation.type}`)}
        </Box>
        <OperationDate date={operation.date} />
        {
          this.state.ordinals.length>1 &&
        <span style={{display: "block", position: "absolute", marginLeft: "100px"}}>
              <iframe width="40px" height="40px" src={this.state.ordinals}/>
        </span>  
        }
      </Cell>
    );
  }
}
export default DateCell;
