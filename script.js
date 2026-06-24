const $ = (id) => document.getElementById(id);

const fields = [
  "age",
  "sex",
  "diagnosis",
  "admissionReason",
  "patientType",
  "weekRange",
  "previousWeekly",
  "progressNotes",
  "extraInfo",
];

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
  if (isChecked("wantHandoff")) list.push("交班單");
  if (isChecked("wantTransfer")) list.push("Transfer note");
  return list;
}

function buildPatientSummary() {
  const age = getValue("age") || "未填";
  const sex = getValue("sex") || "未填";
  const diagnosis = getValue("diagnosis") || "未填";
  const admissionReason = getValue("admissionReason") || "未填";
  const patientType = getValue("patientType") || "一般內科";
  const weekRange = getValue("weekRange") || "未填";

  return `年齡：${age}
性別：${sex}
主要診斷：${diagnosis}
入院原因：${admissionReason}
病人類型：${patientType}
Weekly 週期：${weekRange}`;
}

function removeRecorderNames(lines) {
  const result = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // 移除單獨一行的「專科護理師」，並順便移除前一行可能是記錄者姓名的中文姓名。
    if (/^專科護理師$/.test(line)) {
      const previous = result[result.length - 1]?.trim() || "";
      if (/^[\u4e00-\u9fa5]{2,5}$/.test(previous)) {
        result.pop();
      }
      continue;
    }

    // 移除同一行出現的「XXX 專科護理師」。
    if (/^[\u4e00-\u9fa5]{2,5}\s*專科護理師$/.test(line)) {
      continue;
    }

    result.push(rawLine);
  }

  return result;
}

function cleanClinicalText(text) {
  if (!text) return "";

  let normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\t\u00A0]+/g, " ")
    .replace(/[ ]{2,}/g, " ");

  let lines = normalized.split("\n").map((line) => line.trim());
  lines = removeRecorderNames(lines);

  const cleanedLines = [];
  let blankCount = 0;

  for (const line of lines) {
    // 移除 HIS 複製時常見但對 GPT 整理沒幫助的操作欄位。
    if (/^(VS審核|VS修改)$/.test(line)) continue;

    if (line === "") {
      blankCount += 1;
      if (blankCount <= 1) cleanedLines.push("");
      continue;
    }

    blankCount = 0;
    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildOutputRequest(outputList) {
  return `請幫我整理成：
${outputList.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
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
    setStatus("請至少選擇一個輸出項目。", true);
    return "";
  }

  const previousWeekly = cleanClinicalText(getValue("previousWeekly")) || "無，這可能是第一份 weekly。";
  const progressNotes = cleanClinicalText(rawProgressNotes);
  const extraInfo = cleanClinicalText(getValue("extraInfo")) || "無。";

  return `${buildOutputRequest(outputList)}

【病人基本資料】
${buildPatientSummary()}

【前次 Weekly Summary】
${previousWeekly}

【本週 Progress Notes】
${progressNotes}

【補充事項】
${extraInfo}`.trim();
}

function generatePrompt() {
  const content = buildDataForGpt();
  if (!content) return;

  $("outputPrompt").value = content;
  setStatus("已產生給專屬 GPT 的內容，並已自動移除記錄者姓名與多餘空白。可以複製貼上。");
}

async function copyPrompt() {
  const text = $("outputPrompt").value.trim();

  if (!text) {
    setStatus("目前沒有可複製的內容，請先按「產生 GPT 內容」。", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("已複製到剪貼簿。");
  } catch (error) {
    $("outputPrompt").select();
    document.execCommand("copy");
    setStatus("已嘗試複製。如果失敗，請手動全選複製。");
  }
}

function clearAll() {
  const confirmed = confirm("確定要清除全部病人資料與產生結果嗎？此動作無法復原。");
  if (!confirmed) return;

  fields.forEach((id) => {
    if ($(id)) $(id).value = "";
  });

  $("patientType").value = "一般內科";
  $("sex").value = "";
  $("wantWeekly").checked = true;
  $("wantHandoff").checked = true;
  $("wantTransfer").checked = false;
  $("outputPrompt").value = "";

  setStatus("已清除全部病人資料。");
}

$("generateBtn").addEventListener("click", generatePrompt);
$("copyPromptBtn").addEventListener("click", copyPrompt);
$("clearBtn").addEventListener("click", clearAll);
