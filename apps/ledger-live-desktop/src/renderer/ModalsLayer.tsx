import React from "react";
import styled from "styled-components";
import { Transition, TransitionStatus } from "react-transition-group";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { ModalsState, modalsStateSelector } from "~/renderer/reducers/modals";
import { ModalData } from "~/renderer/modals/types";
import modals from "~/renderer/modals";

const BackDrop = styled.div.attrs<{ state: TransitionStatus }>(({ state }) => ({
  style: {
    opacity: state === "entered" ? 1 : 0,
  },
}))<{ state: TransitionStatus }>`
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  z-index: 100;
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0.3, 1, 0.5, 0.8);
`;

function renderNameState<Name extends keyof ModalData>(name: Name, data: ModalData[Name]) {
  const ModalComponent = modals[name];
  if (ModalComponent) {
    // @ts-expect-error unclear why it can't prove this part
    return <ModalComponent key={name} name={name} {...data} />;
  }
}

function renderFirst(modalsState: ModalsState) {
  for (const key in modalsState) {
    const name = key as keyof ModalData;
    const state = modalsState[name];
    if (state?.isOpened) {
      return renderNameState(name, state.data);
    }
  }
}

const ModalsLayer = ({ modalsState }: { modalsState: ModalsState }) => {
  const first = renderFirst(modalsState);
  return (
    <Transition
      in={!!first}
      appear
      mountOnEnter
      unmountOnExit
      timeout={{
        appear: 100,
        enter: 100,
        exit: 200,
      }}
    >
      {state => <BackDrop state={state}>{first || null}</BackDrop>}
    </Transition>
  );
};

const mapStateToProps = createStructuredSelector({
  modalsState: modalsStateSelector,
});

export default connect(mapStateToProps)(ModalsLayer);
