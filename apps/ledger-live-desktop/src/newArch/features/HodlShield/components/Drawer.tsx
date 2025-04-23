import React, { useMemo, useRef } from "react";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useDispatch, useSelector } from "react-redux";
import {
  hodlShieldDrawerVisibilitySelector,
  hodlShieldStepSelector,
} from "~/renderer/reducers/hodlShield";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { BackRef, HodlShieldRouter } from "LLD/features/HodlShield/screens/router";
import { STEPS_WITH_BACK } from "LLD/features/WalletSync/hooks/useFlows";
import { useTheme } from "styled-components";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 */

interface HodlShieldDrawerProps {
  onClose: () => void;
  onBack?: () => void;
}

const HodlShieldDrawer: React.FC<HodlShieldDrawerProps> = ({ onClose, onBack }) => {
  const childRef = useRef<BackRef>(null);
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const isOpen = useSelector(hodlShieldDrawerVisibilitySelector);
  const currentStep = useSelector(hodlShieldStepSelector);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);

  const handleBack = () => {
    if (childRef.current && hasBack) {
      childRef.current.goBack();
      if (onBack) onBack();
    }
  };

  const closeDrawer = () => {
    dispatch(setDrawerVisibility(false));
    onClose();
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      onRequestBack={hasBack ? handleBack : undefined}
      direction="left"
      forceDisableFocusTrap
      style={{
        background: colors.background.card,
      }}
    >
      <HodlShieldRouter ref={childRef} />
    </SideDrawer>
  );
};

export default HodlShieldDrawer;
