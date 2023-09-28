import React, { useState, useEffect, useReducer, useCallback, useRef, Dispatch } from "react";
import styled from "styled-components";
import Select from "react-select";
import { Inspector } from "react-inspector";
import { useDropzone } from "react-dropzone";
import { from, defer, Observable, Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { listen } from "@ledgerhq/logs";
import { open } from "@ledgerhq/live-common/lib/hw/index";
import { commands } from "../commands";
import { execCommand, getDefaultValue, resolveDependencies } from "../helpers/commands";
import type { Command, ResolvedDeps } from "../helpers/commands";
import Theme from "./Theme";
import Form from "./Form";
import SendButton from "./SendButton";
import ApduCommandSender from "./ApduCommandSender";
import LiveEnvEditor from "./LiveEnvEditor";
import { SmallButton } from "./Smallbutton";
import Transport from "@ledgerhq/hw-transport";

// NB NB NB this file is not yet modularize XD

const Container = styled.div`
  display: flex;
  flex-direction: row;
  font-family: system-ui;
  font-size: 12px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  height: 100vh;
`;

const LeftPanel = styled.div`
  min-width: 300px;
  flex: 1;
  background: ${props => props.theme.darkBackground};
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    margin: 10px 0;
  }
`;

const SectionRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * + * {
    margin-left: 10px;
  }
`;

const AdvancedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  > * {
    margin: 5px 0;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  border-left: 4px solid ${props => props.theme.formLeftBorder};
  > * {
    margin: 10px 0;
  }
`;

const Separator = styled.div`
  border-bottom: 1px solid ${props => props.theme.background};
`;

const MainPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
`;

const HeaderFilters = styled.div`
  display: flex;
  flex-direction: row;
  background-color: ${props => props.theme.darkBackground};
`;

const HeaderFilter = styled.div<{
  filter: string;
  enabled: boolean;
}>`
  user-select: none;
  cursor: pointer;
  background-color: transparent;
  border-bottom: 2px solid;
  border-bottom-color: ${props =>
    props.enabled ? props.theme.logTypes[props.filter] : "rgba(0, 0, 0, 0.5)"};
  opacity: ${props => (props.enabled ? 1 : 0.2)};
  color: ${props =>
    props.enabled ? props.theme.logTypes[props.filter] : props.theme.tabDisabledText};
  flex: 1;
  height: 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  :hover {
    opacity: 1;
  }
`;

const ClearLogs = styled.div`
  position: absolute;
  top: 50px;
  right: 10px;
  padding: 5px;
  border-radius: 4px;
  background: hsla(0, 0%, 0%, 0.5);
  cursor: pointer;
  user-select: none;
  &:hover {
    background: hsla(0, 0%, 100%, 0.1);
    color: hsla(0, 0%, 100%, 0.9);
  }
  &:active {
    background: hsla(0, 0%, 100%, 0.05);
    padding-top: 6px;
    padding-bottom: 4px;
  }
`;

const transportLabels = {
  webble: "Web BLE",
  webusb: "WebUSB",
  webhid: "WebHID",
  hid: "node-hid",
  "proxy@ws://localhost:8435": "proxy ws://localhost:8435",
};

// @ts-ignore
if (typeof ledgerHidTransport === "undefined") {
  // @ts-ignore
  delete transportLabels.hid;
}

type LogInput = {
  type: string;
  text?: string;
  object?: object;
};

type Log = {
  id: string;
  date: Date;
} & LogInput;

const eventObservable = new Observable<LogInput>(o =>
  listen(log => {
    // eslint-disable-next-line default-case
    switch (log.type) {
      case "apdu":
        return o.next({ type: "apdu", text: log.message });
      case "ble-frame":
      case "hid-frame":
        return o.next({ type: "binary", text: log.message });
      case "ble-error":
        return o.next({ type: "error", text: log.message });
      case "ble-verbose":
        return o.next({ type: "verbose", text: log.message });
      case "socket-in":
      case "socket-out":
        return o.next({ type: "verbose", text: log.type, object: log.data });
      case "socket-close":
        return o.next({ type: "verbose", text: "socket closed" });
      case "socket-opened":
        return o.next({ type: "verbose", text: log.message });
    }
    console.log(`(unhandled) ${log.type}: ${log.message}`);
  }),
).pipe(filter(e => Boolean(e)));

const LogRender = styled.pre<{
  log: Log;
}>`
  display: flex;
  flex-direction: row;
  word-break: break-all;
  white-space: pre-line;
  color: ${props => props.theme.logTypes[props.log.type]};
  padding: 0 10px;
  margin: 0;
`;

const transportOptions = Object.keys(transportLabels).map(value => ({
  value,
  // @ts-ignore
  label: transportLabels[value],
}));

let id = 0;

const LS_PREF_TRANSPORT = "preferredTransport";

const useListenTransportDisconnect = (
  cb: (t: Transport) => void,
  deps: unknown[],
): ((t: Transport) => void) => {
  const ref = useRef({ cb });
  useEffect(() => {
    ref.current = { cb };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return useCallback(
    t => {
      const listener = () => {
        t.off("disconnect", listener);
        ref.current.cb(t);
      };
      t.on("disconnect", listener);
    },
    [ref],
  );
};

const announcement = `Welcome to Ledger REPL!

🎊 We have recently fixed our WebUSB transport for Chrome 91 and this tool can be used to test it out on different environments.
`;

type LogAction =
  | {
      type: "ADD";
      payload: LogInput;
    }
  | {
      type: "CLEAR";
    };

const App = () => {
  const [leftTransports, setLeftTransports] = useState<Transport[]>([]);
  const [transport, setTransport] = useState<null | Transport>(null);
  const [transportMode, setTransportMode] = useState(
    (typeof localStorage !== "undefined" && localStorage.getItem(LS_PREF_TRANSPORT)) || "webble",
  );
  const [transportOpening, setTransportOpening] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<null | Command>(null);
  const [commandSub, setCommandSub] = useState<null | Subscription>(null);
  const [commandValue, setCommandValue] = useState([]);

  const [logs, dispatch] = useReducer(
    (logs: Log[], action: LogAction): Log[] => {
      switch (action.type) {
        case "ADD":
          return [
            ...logs,
            {
              id: String(++id),
              date: new Date(),
              ...action.payload,
            },
          ];
        case "CLEAR":
          return [];
        default:
          return logs;
      }
    },
    [
      {
        id: String(++id),
        date: new Date(),
        type: "announcement",
        text: announcement,
      },
    ],
  );

  const addLog = useCallback(
    (log: LogInput) => dispatch({ type: "ADD", payload: log }),
    [dispatch],
  );
  const clearLogs = useCallback(() => dispatch({ type: "CLEAR" }), [dispatch]);

  const addLogError = (error: unknown) =>
    addLog({
      type: "error",
      text:
        (error &&
        typeof error === "object" &&
        "name" in error &&
        error.name &&
        error.name !== "Error"
          ? error.name + ": "
          : "") +
        String(
          (error && typeof error === "object" && "message" in error && error.message) || error,
        ),
    });

  const defaultFilters = {
    error: true,
    warn: true,
    command: true,
    apdu: true,
    binary: true,
    verbose: true,
    announcement: true,
  };

  const [filters, toggleFilter] = useReducer(
    (filters: Record<string, boolean>, type: string): Record<string, boolean> => ({
      ...filters,
      [type]: !filters[type],
    }),
    defaultFilters,
  );

  useEffect(() => {
    const sub = eventObservable.subscribe(addLog);
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO this is the basic minimum.. we should display the dependencies when you open a command.
  // maybe a dependencies should even point to another command which itself need to be manually sent...
  // so ultimately a command is a succession of steps (nesting)
  const [dependencies, setDependencies] = useState<null | ResolvedDeps>(null);

  const onSelectedCommand = useCallback(
    (selectedCommand: null | Command) => {
      if (!selectedCommand || !transport) return;
      setDependencies(null);
      setCommandValue(getDefaultValue(selectedCommand.form));
      setSelectedCommand(selectedCommand);
      resolveDependencies(selectedCommand, transport).then(setDependencies, error => {
        addLogError(error);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transport],
  );

  // const apduInputRef = useRef(null);

  const onSendApdu = useCallback(
    async (value: string) => {
      if (!transport) return false;
      try {
        const hexValueBuffer = Buffer.from(value, "hex");

        if (hexValueBuffer.length === 0) {
          addLogError("Invalid APDU");
          return false;
        }

        await transport.exchange(hexValueBuffer);
        return true;
      } catch (e) {
        addLogError(e);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transport],
  );

  const listenTransportDisconnect = useListenTransportDisconnect(
    t => {
      if (transport === t) {
        setTransport(null);
      } else {
        setLeftTransports(leftTransports.filter(lt => lt !== t));
      }
    },
    [transport, leftTransports, setLeftTransports],
  );

  const onLeaveTransport = useCallback(() => {
    if (!transport) return;
    setTransport(null);
    setLeftTransports(leftTransports.concat([transport]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport]);

  const onClose = useCallback(async () => {
    if (!transport) return;
    await transport.close();
  }, [transport]);

  const onOpenTransport = useCallback(() => {
    setTransportOpening(true);
    setTransport(null);
    open(transportMode).then(
      t => {
        setTransportOpening(false);
        setTransport(t);
        listenTransportDisconnect(t);
      },
      error => {
        setTransportOpening(false);
        addLogError(error);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportMode, listenTransportDisconnect]);

  const onCommandCancel = useCallback(() => {
    if (!commandSub) return;
    commandSub.unsubscribe();
    setCommandSub(null);
  }, [commandSub]);

  const onSendCommand = useCallback(() => {
    if (!selectedCommand || !transport || !dependencies) return;
    addLog({
      type: "command",
      text: "=> " + selectedCommand.id,
    });
    commandValue.forEach(object =>
      addLog({
        type: "command",
        text: "+ ",
        object,
      }),
    );
    const startTime = Date.now();
    setCommandSub(
      defer(() =>
        from(execCommand(selectedCommand, transport, commandValue, dependencies)),
      ).subscribe({
        next: result => {
          addLog({
            type: "command",
            text: "<=",
            object: result,
          });
        },
        complete: () => {
          setCommandSub(null);
          const d = Date.now() - startTime;
          const delta = d < 1000 ? d + "ms" : (d / 1000).toFixed(1) + "s";
          addLog({
            type: "command",
            text: `${selectedCommand.id} completed in ${delta}.`,
          });
        },
        error: error => {
          setCommandSub(null);
          addLogError(error);
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandValue, transport, selectedCommand, dependencies]);

  const logsViewRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (logsViewRef.current) {
      logsViewRef.current.scrollTo(0, logsViewRef.current.scrollHeight);
    }
  }, [logs]);

  // Drag-and-drop APDUs functionality

  const onDrop = useCallback(
    (files: Blob[]) => {
      if (!transport) return;

      const reader = new FileReader();

      reader.onload = async () => {
        const list = (reader.result?.toString() || "").split("\n").filter(Boolean);
        if (list.length === 0) return;

        addLog({
          type: "verbose",
          text: `Attempting to send ${list.length} APDUs`,
        });

        let i = 1;
        for (let apdu of list) {
          addLog({
            type: "verbose",
            text: `APDU - ${i} / ${list.length}`,
          });

          const result = await onSendApdu(apdu);

          if (!result) {
            addLogError(`Could not send APDU: ${apdu}`);
            return;
          }

          i++;
        }

        addLog({
          type: "verbose",
          text: "Successfully sent all APDUs",
        });
      };

      files.forEach(file => reader.readAsBinaryString(file));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transport],
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Theme>
      <Container {...getRootProps()} onClick={undefined}>
        {/* Needed for drag-and-drop functionality */}
        <input {...getInputProps()} />

        <LeftPanel>
          <Section style={{ flex: 1 }}>
            {leftTransports.map((t, i) => (
              <Section key={i}>
                <SectionRow>
                  <div style={{ flex: 1 }}>(still connected)</div>
                  <SendButton
                    title="Re-use"
                    onClick={() => {
                      setTransport(t);
                      setLeftTransports(leftTransports.filter(lt => lt !== t));
                    }}
                  />
                  <SendButton
                    red
                    title="Close"
                    onClick={() => {
                      t.close();
                    }}
                  />
                </SectionRow>
              </Section>
            ))}

            <Section>
              {!transport ? (
                <SectionRow>
                  <div style={{ flex: 1 }}>
                    <Select
                      placeholder="Select a Transport"
                      value={transportOptions.find(o => o.value === transportMode)}
                      onChange={o => {
                        if (!o) return;
                        localStorage.setItem(LS_PREF_TRANSPORT, o.value);
                        setTransportMode(o.value);
                      }}
                      options={transportOptions}
                    />
                  </div>
                  <SendButton
                    disabled={transportOpening}
                    title={transportOpening ? "Opening..." : "Open"}
                    onClick={onOpenTransport}
                  />
                </SectionRow>
              ) : (
                <React.Fragment>
                  <SectionRow>
                    <div style={{ flex: 1 }}>Transport connected!</div>
                    <SendButton secondary title="X" onClick={onLeaveTransport} />
                    <SendButton red title="Close" onClick={onClose} />
                  </SectionRow>
                </React.Fragment>
              )}
            </Section>
            <Separator />
            {transport ? (
              <Section>
                <SectionRow>
                  <div style={{ flex: 1 }}>
                    <Select
                      isDisabled={!!commandSub}
                      placeholder="Select a command"
                      options={commands}
                      onChange={onSelectedCommand}
                      value={selectedCommand}
                      getOptionLabel={c => c.id}
                      getOptionValue={c => c.id}
                    />
                  </div>
                  {selectedCommand ? (
                    commandSub ? (
                      <SendButton red title="Cancel" onClick={onCommandCancel} />
                    ) : (
                      <SendButton title="Send" onClick={onSendCommand} />
                    )
                  ) : null}
                </SectionRow>
                <FormContainer>
                  {selectedCommand
                    ? Object.keys(selectedCommand.dependencies || {}).map(key =>
                        // @ts-ignore
                        dependencies && dependencies[key] ? (
                          <strong key={key}>'{key}' dependency resolved.</strong>
                        ) : (
                          <em key={key}>'{key}' dependency loading...</em>
                        ),
                      )
                    : null}
                  {selectedCommand ? (
                    <Form
                      dependencies={dependencies || {}}
                      form={selectedCommand.form}
                      onChange={setCommandValue}
                      value={commandValue}
                    />
                  ) : null}
                </FormContainer>
              </Section>
            ) : null}
          </Section>
          <Section>
            <AdvancedContainer>
              <SmallButton onClick={() => setAdvanced(advanced => !advanced)}>
                {advanced ? "Hide" : "Advanced"}
              </SmallButton>
              {advanced && <LiveEnvEditor />}
            </AdvancedContainer>
          </Section>
        </LeftPanel>
        <MainPanel>
          <HeaderFilters>
            <HeaderFilter
              filter="command"
              onClick={() => toggleFilter("command")}
              enabled={filters.command}
            >
              Commands
            </HeaderFilter>
            <HeaderFilter filter="apdu" onClick={() => toggleFilter("apdu")} enabled={filters.apdu}>
              APDUs
            </HeaderFilter>
            <HeaderFilter
              filter="binary"
              onClick={() => toggleFilter("binary")}
              enabled={filters.binary}
            >
              Binary
            </HeaderFilter>
            <HeaderFilter
              filter="verbose"
              onClick={() => toggleFilter("verbose")}
              enabled={filters.verbose}
            >
              Verbose
            </HeaderFilter>
          </HeaderFilters>
          <ClearLogs onClick={clearLogs}>Clear logs</ClearLogs>
          <div
            ref={logsViewRef}
            style={{
              flex: 1,
              overflowY: "scroll",
              padding: "20px 10px",
            }}
          >
            {logs
              .filter(log => filters[log.type])
              .map(log => (
                <LogRender log={log} key={log.id}>
                  {log.text}
                  {log.object ? " " : ""}
                  {log.object ? <Inspector theme="chromeDark" data={log.object} /> : null}
                </LogRender>
              ))}
          </div>
          <ApduCommandSender disabled={!transport} onSend={onSendApdu} />
        </MainPanel>
      </Container>
    </Theme>
  );
};

export default App;
