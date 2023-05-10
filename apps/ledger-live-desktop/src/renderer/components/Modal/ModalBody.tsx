import React, { PureComponent } from "react";
import ModalContent from "./ModalContent";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import { RenderProps } from ".";
type Props<Data> = {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  headerStyle?: any;
  onBack?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
  render?: (a?: RenderProps<Data> | null) => any;
  renderFooter?: (a?: RenderProps<Data> | null) => any;
  modalFooterStyle?: any;
  renderProps?: RenderProps<Data>;
  noScroll?: boolean;
  refocusWhenChange?: any;
  backButtonComponent?: React.ReactNode;
};
class ModalBody<Data> extends PureComponent<Props<Data>> {
  componentDidUpdate(prevProps: Props<Data>) {
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
        <ModalContent ref={this._content} noScroll={noScroll}>
          {render && render(renderProps)}
        </ModalContent>
        {renderedFooter && <ModalFooter style={modalFooterStyle}>{renderedFooter}</ModalFooter>}
      </>
    );
  }
}
export default ModalBody;
