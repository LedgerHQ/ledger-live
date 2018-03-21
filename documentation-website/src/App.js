import { Component } from "react";
import "./App.css";

class App extends Component {
  componentDidMount() {
    // HACK FOR NOW
    window.location.href = "./docs";
  }
  render() {
    return null;
  }
}

export default App;
