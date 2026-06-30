import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ToolShell } from "../../components/ToolShell/ToolShell.native";
import { useToolScreenViewModel } from "./useToolScreenViewModel.native";
import type { ToolScreenProps } from "../navigation.native";

export function ToolScreen(props: ToolScreenProps) {
  const { tool } = useToolScreenViewModel(props);

  if (!tool) return <Box />;

  return <ToolShell tool={tool} />;
}

export default ToolScreen;
