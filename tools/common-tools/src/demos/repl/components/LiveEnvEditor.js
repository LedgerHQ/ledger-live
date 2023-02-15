// @flow

import styled from "styled-components";
import React, { useCallback, useEffect, useState } from "react";
import { changes, setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import { setDefaultEnv, updateEnv, getEnv } from "../helpers/env";
import { Resizable } from "re-resizable";
import { map, get } from "lodash";
import ReactTable from "react-table";
import { SmallButton } from "./Smallbutton";

import "react-table/react-table.css";

const convertEnvData = (envData) =>
  map(envData, (value, key) => {
    return {
      name: key,
      type: typeof value,
      value: JSON.stringify(value),
    };
  });

const typeColor = {
  number: "Blue",
  boolean: "DarkYellow",
  string: "Green",
};

const EditableCell = styled.div`
  text-align: center;
  cursor: pointer;
  ${({ theme, type }) =>
    typeColor[type] && `color: ${get(theme.palette, typeColor[type])}`}
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
`;

const saveObjectToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadObjectFromStorage = (key) => JSON.parse(localStorage.getItem(key));

const loadEnv = () => {
  const savedData = loadObjectFromStorage("env_settings");

  return updateEnv(savedData);
};

function LiveEnvEditor() {
  const [state, setState] = useState(loadEnv);

  useEffect(() => {
    const sub = changes.subscribe(({ name, value }) => {
      setState((prevState) => ({ ...prevState, [name]: value }));
    });
    return () => sub.unsubscribe();
  }, [state]);

  const renderEditableCell = useCallback(
    (cellInfo) => {
      return (
        <EditableCell
          contentEditable
          suppressContentEditableWarning
          type={cellInfo.original.type}
          onBlur={(e) => {
            try {
              const value = JSON.parse(e.target.innerText);

              const added = setEnvUnsafe(cellInfo.original.name, value);
              const updatedEnv = getEnv();
              setState(updatedEnv);
              saveObjectToStorage("env_settings", updatedEnv);

              if (!added) {
                e.target.innerText = cellInfo.value;
              }
            } catch (err) {
              if (err instanceof SyntaxError) {
                e.target.innerText = cellInfo.value;
              }
            }
          }}
        >
          {cellInfo.value}
        </EditableCell>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  const columns = [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: "0.9em",
        textAlign: "left",
      },
    },
    {
      Header: "Value",
      accessor: "value",
      Cell: renderEditableCell,
    },
  ];

  return (
    <EditorContainer>
      <Resizable
        enable={{
          top: true,
          left: false,
          right: false,
          bottom: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        defaultSize={{ width: "100%", height: 250 }}
        maxHeight={150}
        minHeight={100}
      >
        <ReactTable
          style={{ width: "100%", height: "100%" }}
          data={state}
          columns={columns}
          minRows={1}
          resizable={false}
          showPagination={false}
          className="-striped -highlight"
          resolveData={convertEnvData}
        />
      </Resizable>
      <SmallButton
        style={{ marginTop: "10px" }}
        onClick={() => {
          setState(setDefaultEnv());
          localStorage.removeItem("env_settings");
        }}
      >
        {"Reset to defaults"}
      </SmallButton>
    </EditorContainer>
  );
}

export default LiveEnvEditor;
