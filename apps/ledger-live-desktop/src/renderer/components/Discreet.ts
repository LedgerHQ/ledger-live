import { useSelector } from "react-redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";
export const useDiscreetMode = () => useSelector(discreetModeSelector);

const Discreet = ({
  children,
  replace = "***",
}: {
  children: React.ReactNode;
  replace: React.ReactNode;
}) => {
  const discreetMode = useDiscreetMode();
  return discreetMode ? replace : children;
};

export default Discreet;
