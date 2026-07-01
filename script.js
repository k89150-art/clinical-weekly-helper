const $ = (id) => document.getElementById(id);

const fields = ["age", "sex", "diagnosis", "admissionReason", "patientType", "weekRange", "previousWeekly", "progressNotes", "extraInfo"];
const outputOptions = ["wantWeekly", "wantHandoff", "wantTransfer"];

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

function buildDataForGpt() {
  const rawProgressNotes = getValue("progressNotes");
  const outputList = buildOutputList();

  if (!rawProgressNotes) {
    setStatus("請先貼上本週 Progress Notes。", true);
    $("progressNotes").focus();
    return "";
  }

  if (outputList.length === 0) {
    setStatus("請至少勾選一個輸出項目。", true);
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
  const content = buildDataForGpt();
  if (!content) return;
  $("outputPrompt").value = content;
  setStatus("已產生並清理完成，可以複製貼到專屬 GPT。");
}

async function copyPrompt() {
  const text = $("outputPrompt").value.trim();
  if (!text) {
    setStatus("目前沒有可複製的內容。", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("已複製到剪貼簿。");
  } catch (error) {
    $("outputPrompt").select();
    document.execCommand("copy");
    setStatus("已嘗試複製，若失敗請手動全選複製。");
  }
}

function clearAll() {
  const confirmed = confirm("確定要清除全部內容嗎？");
  if (!confirmed) return;
  fields.forEach((id) => {
    if ($(id)) $(id).value = "";
  });
  $("patientType").value = "一般內科";
  $("sex").value = "";
  outputOptions.forEach((id) => {
    if ($(id)) $(id).checked = false;
  });
  $("outputPrompt").value = "";
  setStatus("已清除全部內容。");
}

function init() {
  outputOptions.forEach((id) => {
    if ($(id)) $(id).checked = false;
  });
}

$("generateBtn").addEventListener("click", generatePrompt);
$("copyPromptBtn").addEventListener("click", copyPrompt);
$("clearBtn").addEventListener("click", clearAll);

init();
