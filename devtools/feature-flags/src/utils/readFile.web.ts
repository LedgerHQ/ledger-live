/**
 * Web file picker: opens a file dialog and resolves with the selected file's
 * text content.
 */
export function readFile(accept = "application/json"): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.oncancel = () => reject(new Error("No file selected"));
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      file.text().then(resolve, reject);
    };
    input.click();
  });
}
