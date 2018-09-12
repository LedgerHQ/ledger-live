// @flow
import { Component } from "react";
import throttle from "lodash/throttle";
import { connect } from "react-redux";
import db from "../db";
import type { State } from "../reducers";

class DBSave extends Component<{
  dbKey: string,
  state: State,
  hasChanged: (next: State, prev: State) => boolean,
  lense: (s: State) => any,
  throttle: number,
}> {
  componentDidUpdate({ state }) {
    if (this.props.hasChanged(state, this.props.state)) {
      this.save();
    }
  }

  componentWillUnmount() {
    this.save.cancel();
  }

  save = throttle(() => {
    const startTime = Date.now();
    const { lense, dbKey, state } = this.props;
    db.save(dbKey, lense(state)).then(
      () => {
        console.log(
          `${dbKey} DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
      },
      e => {
        console.error(e);
      },
    );
  }, this.props.throttle || 500);

  render() {
    return null;
  }
}

export default connect(state => ({ state }))(DBSave);
