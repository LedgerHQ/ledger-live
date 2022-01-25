// @flow

import { PureComponent } from "react";
import Fuse from "fuse.js";

import type FuseType from "fuse.js";

type Props = {
  items: Array<Object>,
  value: string,
  render: (list: Array<Object>) => React$Node,
  renderEmptySearch: () => React$Node,
  fuseOptions?: Object,

  // if true, it will display no items when value is empty
  filterEmpty?: boolean,
};

type State = {
  results: Array<Object>,
};

class Search extends PureComponent<Props, State> {
  static defaultProps = {
    fuseOptions: {},
    filterEmpty: false,
  };

  state = {
    results: [],
  };

  componentWillMount() {
    this.initFuse(this.props);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.value !== this.props.value) {
      if (this.fuse) {
        const results = this.fuse.search(this.props.value);
        this.formatResults(results);
      }
    }
    if (prevProps.items !== this.props.items) {
      this.initFuse(this.props);
    }
  }

  fuse: FuseType<*> | null = null;

  initFuse(props: Props) {
    const { fuseOptions, items, value } = props;

    this.fuse = new Fuse(items, {
      ...fuseOptions,
    });

    const results = this.fuse.search(value);
    this.formatResults(results);
  }

  formatResults(results: Array<Object>) {
    this.setState({ results: results.map(r => r.item) });
  }

  render() {
    const { render, value, items, filterEmpty, renderEmptySearch } = this.props;
    const { results } = this.state;
    if (!filterEmpty && value === "") {
      return render(items);
    }

    if (value !== "" && !results.length) {
      return renderEmptySearch();
    }

    return render(results);
  }
}

export default Search;
