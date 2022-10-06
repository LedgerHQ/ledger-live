import React, { useState, useEffect } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { useAppInstallProgress } from "@ledgerhq/live-common/apps/react";
import Config from "react-native-config";

const Wrapper = styled(Flex).attrs({
  bg: "palette.background.default",
  p: 4,
  mt: 4,
  borderWidth: 1,
  borderRadius: 4,
  borderColor: "neutral.c40",
})``;

const Status = styled(Flex).attrs(p => ({
  bg: p.active ? "success.c100" : "warning.c100",
  borderRadius: 20,
  borderWidth: 0,
  height: 10,
  width: 10,
}))``;

export default function Benchmarking(props: any) {
  const enabled = Config.ENABLE_BENCHMARKING || false;
  const [list, setList] = useState([]);
  const [start, setStart] = useState(0);
  const [startTransfer, setStartTransfer] = useState(0);
  const [end, setEnd] = useState(0);
  const [lastSeenAppOp, setLastSeenAppOp] = useState(0);

  const { state } = props;
  const { currentAppOp } = state;
  const progress = useAppInstallProgress(state, currentAppOp?.name);

  useEffect(() => {
    if (!enabled) return;
    if (currentAppOp?.type === "uninstall") return;

    if (currentAppOp && !progress && !start) {
      setLastSeenAppOp(currentAppOp);
      setStart(new Date());
      setEnd(0);
    } else if (currentAppOp && progress > 0 && !startTransfer) {
      setStartTransfer(new Date());
    } else if (lastSeenAppOp && !currentAppOp) {
      setEnd(new Date());
    }
  }, [currentAppOp, enabled, lastSeenAppOp, progress, start, startTransfer]);

  useEffect(() => {
    if (!enabled) return;
    if (start && end && lastSeenAppOp) {
      setList(list => [
        ...list,
        `${lastSeenAppOp.name}: ${end - startTransfer}ms [+${
          startTransfer - start
        }ms]`,
      ]);

      setLastSeenAppOp(null);
      setStart(0);
      setStartTransfer(0);
      setEnd(0);
    }
  }, [lastSeenAppOp, end, start, startTransfer, enabled]);

  return enabled ? (
    <Wrapper>
      <Flex flexDirection="row" justifyContent="space-between">
        <Text color="primary.c50" variant="h3">
          {"App install benchmark"}
        </Text>
        <Status active={start && !end} />
      </Flex>
      <Flex pl={2}>
        {list.map((item, i) => (
          <Text mt={3} key={i} variant="small">
            {item}
          </Text>
        ))}
      </Flex>
    </Wrapper>
  ) : null;
}
