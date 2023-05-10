import React, { useState, useEffect } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { AppOp, State } from "@ledgerhq/live-common/apps/index";
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

type StatusCustomProps = { active: boolean };
const Status = styled(Flex).attrs<StatusCustomProps>(p => ({
  bg: p.active ? "success.c50" : "warning.c50",
  borderRadius: 20,
  borderWidth: 0,
  height: 10,
  width: 10,
}))<StatusCustomProps>``;

type Props = { state: State };

export default function Benchmarking(props: Props) {
  const enabled = Config.ENABLE_BENCHMARKING || false;
  const [list, setList] = useState<string[]>([]);
  const [start, setStart] = useState<Date | null>(null);
  const [startTransfer, setStartTransfer] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [lastSeenAppOp, setLastSeenAppOp] = useState<AppOp | null | undefined>(
    null,
  );

  const { state } = props;
  const { currentAppOp } = state;
  const progress = useAppInstallProgress(state, currentAppOp?.name ?? "");

  useEffect(() => {
    if (!enabled) return;
    if (currentAppOp?.type === "uninstall") return;

    if (currentAppOp && !progress && !start) {
      setLastSeenAppOp(currentAppOp);
      setStart(new Date());
      setEnd(null);
    } else if (currentAppOp && progress > 0 && !startTransfer) {
      setStartTransfer(new Date());
    } else if (lastSeenAppOp && !currentAppOp) {
      setEnd(new Date());
    }
  }, [currentAppOp, enabled, lastSeenAppOp, progress, start, startTransfer]);

  useEffect(() => {
    if (!enabled) return;
    if (start && end && startTransfer && lastSeenAppOp) {
      setList(list => [
        ...list,
        `${lastSeenAppOp.name}: ${
          end.getTime() - startTransfer.getTime()
        }ms [+${startTransfer.getTime() - start.getTime()}ms]`,
      ]);

      setLastSeenAppOp(null);
      setStart(null);
      setStartTransfer(null);
      setEnd(null);
    }
  }, [lastSeenAppOp, end, start, startTransfer, enabled]);

  return enabled ? (
    <Wrapper>
      <Flex flexDirection="row" justifyContent="space-between">
        <Text color="primary.c50" variant="h3">
          {"App install benchmark"}
        </Text>
        <Status active={!!(start && !end)} />
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
