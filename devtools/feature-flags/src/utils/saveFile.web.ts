/**
 * Web file delivery: triggers a browser download via a data-URI anchor.
 */
export function saveFile(content: string, filename: string) {
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
