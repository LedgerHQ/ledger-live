import React, { useState } from "react";

export const getStaticProps = async () => ({ props: {} });

function App() {
  const [svgCode, setSvgCode] = useState("");
  const [validationResult, setValidationResult] = useState("");
  const [iconName, setIconName] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const svgFile = event.target.files && event.target.files[0];

    if (svgFile) {
      const svgText = await svgFile.text();
      setIsValid(false);
      setSvgCode(svgText);
      setIconName(svgFile.name.replace(".svg", ""));
      validateSvg(svgText);
    }
  };

  const validateSvg = (svgText: string) => {
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDocument.documentElement;

    console.log({ svgText, svgElement, svgDocument });

    const width = svgElement.getAttribute("width");
    const height = svgElement.getAttribute("height");
    const viewBox = svgElement.getAttribute("viewBox");

    if (width !== height || viewBox !== `0 0 ${width} ${height}`) {
      setValidationResult("Width and height must be the same and match viewBox");
      return;
    }

    const forbiddenAttributes = ["clip-path", "mask", "id", "class", "style", "data", "defs"];
    const allowedElements = [
      "svg",
      "path",
      "line",
      "rect",
      "ellipse",
      "polyline",
      "polygon",
      "circle",
    ];
    const svgChildren = svgElement.children;

    for (let i = 0; i < svgChildren.length; i++) {
      const child = svgChildren[i];
      const tagName = child.tagName.toLowerCase();

      if (!allowedElements.includes(tagName)) {
        setValidationResult(`Element ${tagName} is not allowed`);
        return;
      }

      forbiddenAttributes.forEach(attr => {
        if (child.hasAttribute(attr)) {
          setValidationResult(`Attribute ${attr} is forbidden`);
          return;
        }
      });
    }
    setIsValid(true);
    setValidationResult("Validation successful");
  };

  return (
    <div className="App">
      <style jsx>
        {`
          .App {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 600px;
            margin: 50px auto;
          }

          .svg-dropper {
            display: flex;
            justify-content: space-around;
            width: 100%;
            padding: 20px;
            border: 1px solid #ccc;
            margin-bottom: 20px;
          }

          .svg-container {
            display: flex;
            justify-content: space-around;
            width: 100%;
            padding: 20px;
            margin-bottom: 20px;
          }

          .svg-preview,
          .code-preview {
            flex: 1;
            padding: 10px;
          }

          .code-preview {
            max-height: 200px;
          }

          .validation-result {
            text-align: center;
          }

          input[type="text"] {
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }

          a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }

          a:hover {
            background-color: #0056b3;
          }

          .valid-message {
            color: green;
          }

          .invalid-message {
            color: red;
          }
        `}
      </style>
      <h1>Ledger Live: add crypto SVG icon</h1>

      <div className="svg-dropper">
        <label className="file-input">
          <input type="file" accept=".svg" onChange={handleFile} />
          <span>Choose SVG File</span>
        </label>
      </div>

      <div className="validation-result">
        <p className={isValid ? "valid-message" : "invalid-message"}>{validationResult}</p>

        <input
          type="text"
          placeholder="Icon Name (e.g. BTC)"
          value={iconName}
          onChange={e => setIconName(e.target.value)}
        />

        {isValid && svgCode && (
          <a
            href={`https://github.com/ledgerhq/ledger-live/new/develop/libs/ui/packages/crypto-icons/src/svg/?filename=${iconName}.svg&value=${encodeURIComponent(
              svgCode,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Create PR
          </a>
        )}
      </div>

      <div className="svg-container">
        <div className="svg-preview">
          <div dangerouslySetInnerHTML={{ __html: svgCode }} />
        </div>

        <div className="code-preview">
          <code>{svgCode}</code>
        </div>
      </div>
    </div>
  );
}

export default App;
