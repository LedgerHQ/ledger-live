import React, { useContext } from "react";
import styled from "styled-components";
import SideBarContext from "../index";
import Text from "../../../asorted/Text";
import TransitionInOut from "../../../transitions/TransitionInOut";
import Flex from "../../../layout/Flex";

const ItemWrapper = styled.li`
  /** DEFAULT VARIANT **/
  --ll-sidebar-item-label-color: ${props => props.theme.colors.neutral.c80};
  --ll-sidebar-item-icon-color: ${props => props.theme.colors.neutral.c80};
  --ll-sidebar-item-background-color: unset;

  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: ${p => p.theme.space[3]}px;
  column-gap: ${p => p.theme.space[5]}px;
  padding: ${p => p.theme.space[5]}px;
  border-radius: ${p => p.theme.space[3]}px;
  min-height: ${p => p.theme.space[13]}px;
  min-width: ${p => p.theme.space[13]}px;

  color: var(--ll-sidebar-item-icon-color);
  background-color: var(--ll-sidebar-item-background-color);
  cursor: pointer;

  /** HOVER VARIANT **/
  &:hover {
    --ll-sidebar-item-label-color: ${props => props.theme.colors.neutral.c100};
    --ll-sidebar-item-icon-color: ${props => props.theme.colors.primary.c80};
    --ll-sidebar-item-background-color: unset;
  }

  /** FOCUS VARIANT **/
  &:focus {
    box-shadow: 0px 0px 0px 4px rgba(187, 176, 255, 0.4);
    border-radius: ${p => p.theme.space[3]}px;
  }

  /** ACTIVE VARIANT **/
  &[data-active="true"] {
    --ll-sidebar-item-label-color: ${props => props.theme.colors.neutral.c100};
    --ll-sidebar-item-icon-color: ${props => props.theme.colors.primary.c80};
    --ll-sidebar-item-background-color: ${props => props.theme.colors.primary.c20};
  }

  /** DISABLE VARIANT **/
  &[data-disable="true"] {
    --ll-sidebar-item-label-color: ${props => props.theme.colors.neutral.c80};
    --ll-sidebar-item-icon-color: ${props => props.theme.colors.neutral.c80};
    --ll-sidebar-item-background-color: unset;
    opacity: 0.3;
    cursor: unset;
    pointer-events: none;
  }
`;

const CollapsedBadgeContainer = styled.div`
  position: absolute;
  margin-top: -${p => p.theme.space[11]}px;
  margin-left: ${p => p.theme.space[8]}px;
`;

const DefaultBadge = styled.div`
  height: ${p => p.theme.space[4]}px;
  width: ${p => p.theme.space[4]}px;
  border-radius: ${p => p.theme.radii[2]}px;
  background-color: ${p => p.theme.colors.primary.c80};
`;

export const ItemLabel = styled(Text)`
  display: inline-block;
  color: var(--ll-sidebar-item-label-color);

  text-transform: capitalize;
`;

export type ItemType = {
  label: string;
  children: JSX.Element;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  displayNotificationBadge?: boolean;
  customNotificationBadge?: JSX.Element;
};

const Item = ({
  label,
  children,
  onClick,
  isActive,
  isDisabled,
  displayNotificationBadge,
  customNotificationBadge,
}: ItemType): JSX.Element => {
  const { isExpanded } = useContext(SideBarContext);

  const handleClick = () => {
    if (isDisabled) return;
    onClick();
  };

  const badge = customNotificationBadge ?? <DefaultBadge />;

  return (
    <>
      <ItemWrapper
        role="button"
        onClick={handleClick}
        data-active={isActive}
        data-disable={isDisabled}
        tabIndex={0}
      >
        {children}
        <CollapsedBadgeContainer>
          <TransitionInOut
            unmountOnExit
            mountOnEnter
            in={!isExpanded}
            style={{ transitionDelay: !isExpanded ? "200ms" : 0 }}
          >
            {displayNotificationBadge && badge}
          </TransitionInOut>
        </CollapsedBadgeContainer>
        <TransitionInOut
          timeout={200}
          in={isExpanded}
          unmountOnExit
          mountOnEnter
          style={{ transitionDelay: isExpanded ? "200ms" : 0, display: "flex", flex: "1" }}
        >
          <ItemLabel variant="paragraph">{label}</ItemLabel>
          <Flex alignItems="center" justifyContent="flex-end" ml={2} flexGrow={1}>
            {displayNotificationBadge && badge}
          </Flex>
        </TransitionInOut>
      </ItemWrapper>
    </>
  );
};

export default Item;
