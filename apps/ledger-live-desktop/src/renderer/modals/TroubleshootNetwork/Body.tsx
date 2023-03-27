import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import {
  troubleshootOverObservable,
  troubleshootOverObservableReducer,
} from "@ledgerhq/live-common/network-troubleshooting/index";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import styled from "styled-components";
import Tooltip from "~/renderer/components/Tooltip";
import TranslatedError from "~/renderer/components/TranslatedError";
const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  th {
    padding: 5px;
    font-weight: bold;
    text-align: left;
  }
  td {
    padding: 5px;
  }
`;
type Props = {
  onClose: () => void;
};
function useRendererState() {
  const [state, dispatch] = useReducer(troubleshootOverObservableReducer, []);
  useEffect(() => {
    const s = troubleshootOverObservable().subscribe(dispatch);
    return () => s.unsubscribe();
  }, []);
  return state;
}
const Status = ({ status }: { status?: TroubleshootStatus }) => {
  switch (status?.status) {
    case "success":
      return "✅";
    case "error":
      return (
        <Tooltip
          tooltipBg="alertRed"
          content={
            <Box
              fontSize={4}
              p={2}
              style={{
                maxWidth: 250,
              }}
            >
              <TranslatedError error={new Error(status.error || "unknown")} />
            </Box>
          }
        >
          ❌
        </Tooltip>
      );
    default:
      return <Spinner size={20} />;
  }
};
const RenderState = ({ state }: { state: TroubleshootStatus[] }) => {
  return (
    <Table>
      <thead>
        <tr>
          <th>TEST</th>
          <th>RENDERER</th>
        </tr>
      </thead>
      <tbody>
        {state.map(status => {
          return (
            <tr key={status.title}>
              <td>{status.title}</td>
              <td>
                <Status status={status} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
const Body = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const rendererState = useRendererState();
  return (
    <ModalBody
      onClose={onClose}
      title={t("troubleshootNetwork.title")}
      render={() => (
        <Box
          relative
          style={{
            height: 500,
          }}
          px={5}
          pb={8}
        >
          <TrackPage category="Modal" name="TroubleshootNetwork" />
          <RenderState state={rendererState} />
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal justifyContent="flex-end">
          <Button onClick={onClose} primary>
            {t("common.continue")}
          </Button>
        </Box>
      )}
    />
  );
};
export default Body;
