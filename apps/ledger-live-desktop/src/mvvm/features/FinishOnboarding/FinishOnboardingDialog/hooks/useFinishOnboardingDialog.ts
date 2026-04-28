import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openFinishPostOnboarding } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/finishOnboardingDialog";

const useFinishOnboardingDialog = () => {
  const dispatch = useDispatch();

  const handleOpen = useCallback(() => {
    dispatch(openFinishPostOnboarding());
  }, [dispatch]);

  return { handleOpen };
};

export default useFinishOnboardingDialog;
