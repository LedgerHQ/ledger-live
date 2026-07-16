import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ToolShell } from "../../components";
import { useToolScreenViewModel } from "./useToolScreenViewModel";
import type { ToolScreenProps } from "../navigation";

export function ToolScreen(props: ToolScreenProps) {
  const { tool } = useToolScreenViewModel(props);

  if (!tool) return <Box />;

  return <ToolShell tool={tool} />;
}

export default ToolScreen;
