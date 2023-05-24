import { renderLoading } from "~/renderer/components/DeviceAction/rendering";

type Props = {
  children?: React.ReactNode;
};

const StepProgress = ({ children }: Props) => renderLoading({ children });

export default StepProgress;
