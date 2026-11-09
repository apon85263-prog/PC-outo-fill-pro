const $ = (id) => document.getElementById(id);
let extracted = {};

$("extract").addEventListener("click", async () => {
  const file = $("file").files[0];
  if (!file) {
    $("status").textContent = "Please choose a passport PDF.";
    return;
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    $("status").textContent = "This version supports text-based PDF files only.";
    return;
  }

  $("status").textContent = "Reading file locally...";
  try {
    const text = await extractPdfText(file);
    extracted = parsePassportText(text);
    render(extracted);
    $("status").textContent = text.trim()
      ? "Done. Verify the extracted information before filling."
      : "No readable text found. Scanned PDFs are not supported.";
  } catch (error) {
    extracted = {};
    render(extracted);
    $("status").textContent = `Could not read this file: ${error.message}`;
  }
});

$("fill").addEventListener("click", async () => {
  if (!Object.values(extracted).some(Boolean)) {
    $("status").textContent = "Extract and verify information before filling the form.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || "")) {
    $("status").textContent = "Open the form in a regular website tab, then try again.";
    return;
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tab.id, { type: "fill", data: extracted });
    $("status").textContent = "Fill attempted. Review every field; nothing was submitted.";
  } catch {
    $("status").textContent = "Could not access this page. Reload it and try again.";
  }
});

function render(data) {
  const keys = ["name", "passportNumber", "dateOfBirth", "nationality", "fatherName", "motherName", "address"];
  $("results").innerHTML = keys.map((key) =>
    `<div class="card row"><div class="key">${label(key)}</div><div class="val">${escapeHtml(data[key] || "Not found")}</div></div>`
  ).join("");
}

function label(key) {
  return ({ name: "Name", passportNumber: "Passport No.", dateOfBirth: "Date of Birth", nationality: "Nationality", fatherName: "Father", motherName: "Mother", address: "Address" })[key] || key;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function parsePassportText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pick = (pattern) => {
    const line = lines.find((item) => pattern.test(item));
    if (!line) return "";
    const match = line.match(/[:\-]\s*(.+)$/);
    return match ? match[1].trim() : line.replace(pattern, "").trim();
  };

  const data = {
    passportNumber: pick(/passport\s*(no|number)/i),
    name: pick(/^name\b/i),
    dateOfBirth: pick(/date\s*of\s*birth|dob/i),
    nationality: pick(/nationality/i),
    fatherName: pick(/father/i),
    motherName: pick(/mother/i),
    address: pick(/address/i)
  };
  if (!data.passportNumber) {
    const match = text.match(/\b[A-Z][0-9]{7,9}\b/);
    if (match) data.passportNumber = match[0];
  }
  return data;
}
