import { useEffect, memo } from "react";
// eslint-disable-next-line import/no-cycle
import { track } from "./segment";

// class Track extends PureComponent<{
//   onMount?: boolean;
//   onUnmount?: boolean;
//   onUpdate?: boolean;
//   event: string;
//   mandatory?: boolean;
// }> {
//   componentDidMount() {
//     if (typeof this.props.event !== "string") {
//       console.warn("analytics Track: invalid event=", this.props.event);
//     }

//     if (this.props.onMount) this.track();
//   }

//   componentDidUpdate() {
//     if (this.props.onUpdate) this.track();
//   }

//   componentWillUnmount() {
//     if (this.props.onUnmount) this.track();
//   }

//   track = () => {
//     const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } =
//       this.props;
//     track(event, properties, mandatory);
//   };

//   render() {
//     return null;
//   }
// }

// export default Track;

type Props = {
  onMount?: boolean;
  onUnmount?: boolean;
  onUpdate?: boolean;
  event: string;
  mandatory?: boolean;
  [key: string]: unknown;
};

export default memo((props: Props): null => {
  const { event, onMount, onUnmount, onUpdate } = props;

  function doTrack() {
    const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } =
      props;
    track(event, properties, mandatory);
  }

  useEffect(
    function mount() {
      if (typeof event !== "string") {
        console.warn("analytics Track: invalid event=", event);
      }

      if (onMount) doTrack();
      return function unmount() {
        if (onUnmount) doTrack();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (onUpdate) {
    doTrack();
  }

  return null;
});
