import { PureComponent } from "react";
// eslint-disable-next-line import/no-cycle
import { track } from "./segment";

class Track extends PureComponent<{
  onMount?: boolean;
  onUnmount?: boolean;
  onUpdate?: boolean;
  event: string;
  mandatory?: boolean;
}> {
  componentDidMount() {
    if (typeof this.props.event !== "string") {
      console.warn("analytics Track: invalid event=", this.props.event);
    }

    if (this.props.onMount) this.track();
  }

  componentDidUpdate() {
    if (this.props.onUpdate) this.track();
  }

  componentWillUnmount() {
    if (this.props.onUnmount) this.track();
  }

  track = () => {
    const {
      event,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onMount,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onUnmount,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onUpdate,
      mandatory,
      ...properties
    } = this.props;
    track(event, properties, mandatory);
  };

  render() {
    return null;
  }
}

export default Track;
