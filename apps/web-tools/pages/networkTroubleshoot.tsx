import React, { useEffect, useReducer } from "react";
import {
  TroubleshootStatus,
  troubleshootOverObservable,
  troubleshootOverObservableReducer,
} from "@ledgerhq/live-common/network-troubleshooting/index";

export const getStaticProps = async () => ({ props: {} });

function useTroubleshootState() {
  const [state, dispatch] = useReducer(troubleshootOverObservableReducer, []);
  useEffect(() => {
    const s = troubleshootOverObservable().subscribe(dispatch);
    return () => s.unsubscribe();
  }, []);
  return state;
}

function App() {
  const state = useTroubleshootState();

  return (
    <div>
      <h1>Network Troubleshoot</h1>

      <table>
        <thead>
          <tr>
            <th>TEST</th>
            <th>RESULT</th>
          </tr>
        </thead>
        <tbody>
          {state.map(s => {
            return (
              <tr key={s.title}>
                <td>{s.title}</td>
                <td>
                  <Status status={s} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Status = ({ status }: { status: TroubleshootStatus }) => {
  switch (status?.status) {
    case "success":
      return <>✅</>;
    case "error":
      return (
        <span style={{ color: "red" }} role="img" aria-label="Error" title={status.error}>
          ❌
        </span>
      );
    default:
      return <>⏳</>;
  }
};

export default App;
