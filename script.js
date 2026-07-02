const $ = (id) => document.getElementById(id);

const fields = ["age", "sex", "diagnosis", "admissionReason", "patientType", "weekRange", "previousWeekly", "progressNotes", "extraInfo"];
const outputOptions = ["wantWeekly", "wantHandoff", "wantTransfer"];
const scannedTextareaIds = ["previousWeekly", "progressNotes", "extraInfo"];

const phiPatterns = [
  { label: "身分證字號格式", regex: /\b[A-Za-z][12]\d{8}\b/g },
  { label: "手機號碼格式", regex: /\b09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/g },
  { label: "生日格式（伴隨生日/DOB 關鍵字）", regex: /(生日|出生日期|DOB)[:\s：]{0,4}(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])/gi },
  { label: "病歷號 / 證號標註", regex: /(病歷號|病歷号|MRN|chart no\.?)[:\s：]{0,3}\d{4,10}/gi },
];

const countThresholds = {
  previousWeekly: 6000,
  progressNotes: 15000,
  extraInfo: 3000,
};

function getValue(id) {
  return ($(id)?.value || "").trim();
}

function isChecked(id) {
  return Boolean($(id)?.checked);
}

function setStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message;
  status.style.color = isError ? "#c52f3d" : "#1b4295";
}

function buildOutputList() {
  const list = [];
  if (isChecked("wantWeekly")) list.push("Weekly Summary");
  if (isChecked("wantHandoff")) list.push("\u4ea4\u73ed\u55ae");
  if (isChecked("wantTransfer")) list.push("Transfer note");
  return list;
}

function buildPatientSummary() {
  return `\u5e74\u9f61\uff1a${getValue("age") || "\u672a\u586b"}
\u6027\u5225\uff1a${getValue("sex") || "\u672a\u586b"}
\u4e3b\u8981\u8a3a\u65b7\uff1a${getValue("diagnosis") || "\u672a\u586b"}
\u5165\u9662\u539f\u56e0\uff1a${getValue("admissionReason") || "\u672a\u586b"}
\u985e\u578b\uff1a${getValue("patientType") || "\u4e00\u822c\u5167\u79d1"}
Weekly \u9031\u671f\uff1a${getValue("weekRange") || "\u672a\u586b"}`;
}

function removeNames(lines) {
  const result = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^\u5c08\u79d1\u8b77\u7406\u5e2b$/.test(line)) {
      const previous = result[result.length - 1]?.trim() || "";
      if (/^[\u4e00-\u9fa5]{2,5}$/.test(previous)) result.pop();
      continue;
    }
    if (/^[\u4e00-\u9fa5]{2,5}\s*\u5c08\u79d1\u8b77\u7406\u5e2b$/.test(line)) continue;
    result.push(rawLine);
  }
  return result;
}

function cleanClinicalText(text) {
  if (!text) return "";

  const skipLines = new Set([
    "VS\u5be9\u6838",
    "VS\u4fee\u6539",
    "\u4fee\u6539",
    "\u5b58\u70ba\u7bc4\u672c",
  ]);

  let lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t\u00A0]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim());

  lines = removeNames(lines);

  const cleaned = [];
  let blankCount = 0;

  for (const line of lines) {
    if (skipLines.has(line)) continue;
    if (/^Title\s*[:\uff1a]?$/.test(line)) continue;

    if (line === "") {
      blankCount += 1;
      if (blankCount <= 1) cleaned.push("");
      continue;
    }

    blankCount = 0;
    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildOutputRequest(outputList) {
  return `\u8acb\u5e6b\u6211\u6574\u7406\u6210\uff1a\n${outputList.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

// ---------------- \u96b1\u79c1\u5075\u6e2c\uff08\u7d14\u524d\u7aef\uff0c\u4e0d\u4e0a\u50b3\u3001\u4e0d\u5132\u5b58\uff09 ----------------

function scanTextForPHI(text) {
  const findings = [];
  for (const pattern of phiPatterns) {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      findings.push({ label: pattern.label, count: matches.length });
    }
  }
  return findings;
}

function updatePrivacyWarning() {
  const combinedText = scannedTextareaIds.map((id) => getValue(id)).join("\n");
  const findings = scanTextForPHI(combinedText);
  const banner = $("privacyWarning");
  const list = $("privacyWarningList");

  if (findings.length === 0) {
    banner.hidden = true;
    list.innerHTML = "";
    return false;
  }

  list.innerHTML = findings.map((item) => `<li>${item.label} \u00d7 ${item.count}</li>`).join("");
  banner.hidden = false;
  return true;
}

// ---------------- \u5b57\u6578\u7d71\u8a08 ----------------

function updateCharCount(id) {
  const countEl = $(`${id}Count`);
  if (!countEl) return;
  const length = getValue(id).length;
  countEl.textContent = `${length.toLocaleString("zh-TW")} \u5b57`;
  const threshold = countThresholds[id];
  if (threshold && length > threshold) {
    countEl.classList.add("count-warning");
    countEl.textContent += "\uff08\u5167\u5bb9\u504f\u9577\uff0c\u5efa\u8b70\u78ba\u8a8d GPT \u53ef\u63a5\u53d7\u7684\u9577\u5ea6\uff09";
  } else {
    countEl.classList.remove("count-warning");
  }
}

// ---------------- \u96e2\u958b\u9801\u9762\u63d0\u9192 ----------------

function hasUnsavedContent() {
  const hasFieldContent = fields.some((id) => getValue(id) !== "");
  const hasOutput = getValue("outputPrompt") !== "";
  return hasFieldContent || hasOutput;
}

function handleBeforeUnload(event) {
  if (!hasUnsavedContent()) return;
  event.preventDefault();
  event.returnValue = "";
}

// ---------------- \u4e3b\u8981\u908f\u8f2f ----------------

function buildDataForGpt() {
  const rawProgressNotes = getValue("progressNotes");
  const outputList = buildOutputList();

  if (!rawProgressNotes) {
    setStatus("\u8acb\u5148\u8cbc\u4e0a\u672c\u9031 Progress Notes\u3002", true);
    $("progressNotes").focus();
    return "";
  }

  if (outputList.length === 0) {
    setStatus("\u8acb\u81f3\u5c11\u52fe\u9078\u4e00\u500b\u8f38\u51fa\u9805\u76ee\u3002", true);
    return "";
  }

  const previousWeekly = cleanClinicalText(getValue("previousWeekly")) || "\u7121\uff0c\u9019\u53ef\u80fd\u662f\u7b2c\u4e00\u4efd weekly\u3002";
  const progressNotes = cleanClinicalText(rawProgressNotes);
  const extraInfo = cleanClinicalText(getValue("extraInfo")) || "\u7121\u3002";

  return `${buildOutputRequest(outputList)}

\u3010\u75c5\u4eba\u57fa\u672c\u8cc7\u6599\u3011
${buildPatientSummary()}

\u3010\u524d\u6b21 Weekly Summary\u3011
${previousWeekly}

\u3010\u672c\u9031 Progress Notes\u3011
${progressNotes}

\u3010\u88dc\u5145\u4e8b\u9805\u3011
${extraInfo}`.trim();
}

function generatePrompt() {
  const hasPHI = updatePrivacyWarning();
  const content = buildDataForGpt();
  if (!content) return;
  $("outputPrompt").value = content;
  if (hasPHI) {
    setStatus("\u5df2\u7522\u751f\uff0c\u4f46\u5075\u6e2c\u5230\u7591\u4f3c\u53ef\u8b58\u5225\u8cc7\u8a0a\uff0c\u8acb\u5148\u78ba\u8a8d\u4e0a\u65b9\u8b66\u793a\u3002", true);
  } else {
    setStatus("\u5df2\u7522\u751f\u4e26\u6e05\u7406\u5b8c\u6210\uff0c\u53ef\u4ee5\u8907\u88fd\u8cbc\u5230\u5c08\u5c6c GPT\u3002");
  }
}

async function copyPrompt() {
  const text = $("outputPrompt").value.trim();
  if (!text) {
    setStatus("\u76ee\u524d\u6c92\u6709\u53ef\u8907\u88fd\u7684\u5167\u5bb9\u3002", true);
    return;
  }
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch (error) {
    $("outputPrompt").select();
    document.execCommand("copy");
    copied = true;
  }

  if (isChecked("autoClear")) {
    clearAll(true);
    setStatus("\u5df2\u8907\u88fd\u4e26\u81ea\u52d5\u6e05\u9664\u5168\u90e8\u5167\u5bb9\u3002");
    return;
  }

  setStatus(copied ? "\u5df2\u8907\u88fd\u5230\u526a\u8cbc\u7c3f\u3002" : "\u5df2\u5617\u8a66\u8907\u88fd\uff0c\u82e5\u5931\u6557\u8acb\u624b\u52d5\u5168\u9078\u8907\u88fd\u3002");
}

function clearAll(skipConfirm = false) {
  if (!skipConfirm) {
    const confirmed = confirm("\u78ba\u5b9a\u8981\u6e05\u9664\u5168\u90e8\u5167\u5bb9\u55ce\uff1f");
    if (!confirmed) return;
  }
  fields.forEach((id) => {
    if ($(id)) $(id).value = "";
  });
  $("patientType").value = "\u4e00\u822c\u5167\u79d1";
  $("sex").value = "";
  outputOptions.forEach((id) => {
    if ($(id)) $(id).checked = false;
  });
  $("outputPrompt").value = "";
  scannedTextareaIds.forEach((id) => updateCharCount(id));
  updatePrivacyWarning();
  if (!skipConfirm) setStatus("\u5df2\u6e05\u9664\u5168\u90e8\u5167\u5bb9\u3002");
}

function init() {
  outputOptions.forEach((id) => {
    if ($(id)) $(id).checked = false;
  });

  scannedTextareaIds.forEach((id) => {
    const el = $(id);
    if (!el) return;
    updateCharCount(id);
    el.addEventListener("input", () => {
      updateCharCount(id);
      updatePrivacyWarning();
    });
  });

  window.addEventListener("beforeunload", handleBeforeUnload);
}

$("generateBtn").addEventListener("click", generatePrompt);
$("copyPromptBtn").addEventListener("click", copyPrompt);
$("clearBtn").addEventListener("click", () => clearAll(false));

init();
