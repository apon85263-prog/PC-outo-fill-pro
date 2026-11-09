async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((match) => match[1]);
  let output = "";

  for (const stream of streams) {
    for (const match of stream.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) {
      output += decodePdfString(match[1]) + "\n";
    }
    for (const match of stream.matchAll(/\[((?:[^\]]|\][^\]])*)\]\s*TJ/g)) {
      const strings = [...match[1].matchAll(/\(((?:\\.|[^\\)])*)\)/g)];
      output += strings.map((item) => decodePdfString(item[1])).join("") + "\n";
    }
  }
  return output;
}

function decodePdfString(value) {
  return value
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\([nrtbf])/g, (_, code) => ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" })[code])
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}
