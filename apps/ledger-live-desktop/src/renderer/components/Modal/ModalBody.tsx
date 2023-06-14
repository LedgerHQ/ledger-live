import React, { PureComponent } from "react";
import ModalContent from "./ModalContent";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import { RenderProps } from ".";
import { ModalData } from "~/renderer/modals/types";

type Props<Name extends keyof ModalData> = {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  headerStyle?: React.CSSProperties;
  onBack?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
  render?: (a?: RenderProps<Name> | null) => React.ReactNode;
  renderFooter?: (a?: RenderProps<Name> | null) => React.ReactNode;
  modalFooterStyle?: React.CSSProperties;
  renderProps?: RenderProps<Name>;
  noScroll?: boolean;
  refocusWhenChange?: unknown;
  backButtonComponent?: React.ReactNode;
  pt?: number;
};
class ModalBody<Name extends keyof ModalData> extends PureComponent<Props<Name>> {
  componentDidUpdate(prevProps: Props<Name>) {
    const shouldFocus = prevProps.refocusWhenChange !== this.props.refocusWhenChange;
    if (shouldFocus && this._content.current) {
      this._content.current?.focus();
    }
  }

  _content = React.createRef<HTMLDivElement>();
  render() {
    const {
      onBack,
      backButtonComponent,
      onClose,
      title,
      subTitle,
      headerStyle,
      render,
      renderFooter,
      renderProps,
      noScroll,
      modalFooterStyle,
      pt,
    } = this.props;

    // For `renderFooter` returning falsy values, we need to resolve first.
    const renderedFooter = renderFooter && renderFooter(renderProps);
    return (
      <>
        <ModalHeader
          subTitle={subTitle}
          onBack={onBack}
          onClose={onClose}
          style={headerStyle}
          backButtonComponent={backButtonComponent}
        >
          {title || null}
        </ModalHeader>
        <ModalContent pt={pt} ref={this._content} noScroll={noScroll}>
          {render && render(renderProps)}
        </ModalContent>
        {renderedFooter && <ModalFooter style={modalFooterStyle}>{renderedFooter}</ModalFooter>}
      </>
    );
  }
}
export default ModalBody;
