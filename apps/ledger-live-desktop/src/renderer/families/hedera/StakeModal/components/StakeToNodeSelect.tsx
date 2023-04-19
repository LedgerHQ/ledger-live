// @flow

import Box from "~/renderer/components/Box";
import React, { useMemo, useState } from "react";
import { Trans } from "react-i18next";

import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";

import type { Option } from "~/renderer/components/Select";

type Props = { selected: string | undefined | null, nodeListOptions: Option[] | undefined | null, onChange: (value: string) => void };

const StakeToNodeSelect = ({ selected, nodeListOptions, onChange }: Props) => {
  const [hoverSelection, setHoverSelection] = useState("");

  function onClick(nodeId: string) {
    onChange(nodeId);
  }

  function hover(nodeId: string) {
    setHoverSelection(nodeId);
  }

  function unhover() {
    setHoverSelection("");
  }

  const listIconStyle = {
    width: "32px", 
    height: "32px", 
    background: "#717070", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  };

  const descriptionStyle = {
    display: "block",
    fontFamily: "Inter", 
    fontWeight: "600", 
    fontSize: "14px", 
    textOverflow: "ellipsis", 
    maxWidth: "201px", 
    whiteSpace: "nowrap", 
    overflow: "hidden",
    lineHeight: "17px", 
  };

  const nodeItems = nodeListOptions?.map((value) => {
    if (value.description != undefined) {
      const description = value.description.replace("Hosted by ", "");
      return(
        <li onClick={() => onClick(value.label)} onMouseEnter={() => hover(value.label)} onMouseLeave={() => unhover()} style={hoverSelection == value.label ? {background: "#383a3e", padding: "5px 16px", borderRadius: "8px"} : { padding: "5px 16px", }}>
          <Box style={{ display: "flex", flexDirection: "row", }}>
            <Box style={listIconStyle}>
              { description.charAt(0) }
            </Box>
            <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "360px", marginLeft: "12px", }}>
              <Box style={{ display: "flex", }}>
                <Box style={ descriptionStyle }>
                  { description }
                </Box>
                <Box style={{ fontFamily: "Inter", fontWeight: "500", fontSize: "12px", lineHeight: "15px", }}>
                  { value.label }
                </Box>
              </Box>
              <Box style={{ marginRight: "32px",  textAlign: "right" }}>
                <Box style={{ fontFamily: "Inter", fontWeight: "600", fontSize: "14px", lineHeight: "17px", }}>
                  {
                    Math.round(value.stake / 100_000_000).toLocaleString(
                      undefined, 
                      { minimumFractionDigits: 0 }
                    )
                  }
                </Box>
                <Box style={value.rewarding ? { color: "#5F9954", fontFamily: "Inter", fontWeight: "500", fontSize: "12px", lineHeight: "15px", } : { color: "#DD9323", fontFamily: "Inter", fontWeight: "500", fontSize: "12px", lineHeight: "15px", }}>
                  { value.rewarding ? "Earning rewards" : "Not earning rewards" }
                </Box>
              </Box>
            </Box>
          </Box>
        </li>
      )
    }
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "center",
      }}
    >
      <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "420px", padding: "16px", borderBottom: "1px solid #272727" }}>
        <Label>
          <Trans i18nKey="hedera.stake.flow.stake.nodesLabel" />
        </Label>
        <Label style={{ textAlign: "right", }}>
          <Trans i18nKey="hedera.stake.flow.stake.stakedLabel" />
        </Label>
      </Box>
      <ul style={{ display: "flex", flexDirection: "column", marginTop: "15px", gap: "20px", listStyleType: "none", height: "254px", width: "420px", overflowY: "auto", overflowX: "hidden", }}>{ nodeItems }</ul>
    </div>
  );
};

export default StakeToNodeSelect;