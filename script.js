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

const options = [
  "wantWeekly",
  "wantHandoff",
  "wantTransfer",
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
  const age = getValue("age") || "not provided";
  const sex = getValue("sex") || "not provided";
  const diagnosis = getValue("diagnosis") || "not provided";
  const admissionReason = getValue("admissionReason") || "not provided";
  const patientType = getValue("patientType") || "一般內科";
  const weekRange = getValue("weekRange") || "not provided";

  return `年齡：${age}
性別：${sex}
主要診斷：${diagnosis}
入院原因：${admissionReason}
病人類型：${patientType}
Weekly 週期：${weekRange}`;
}

function buildFocusRules(patientType) {
  const rules = {
    "感染症": `- 請特別整理 fever pattern、WBC/CRP/PCT trend、culture report、antibiotics 日期與調整原因、infection source、image finding。`,
    "心臟科 / Cath / PCI": `- 請特別整理 chest pain、ECG、cardiac enzyme、echo、TET、cath finding、PCI/stent、DAPT、hemodynamic status、discharge medication。`,
    "呼吸衰竭 / ICU": `- 請特別整理 oxygen device、SpO2、ABG、CXR、sputum、ETT/MV、weaning course、ICU transfer、sedation、infection issue。`,
    "腎臟 / AKI / ESRD": `- 請特別整理 Cr/eGFR、BUN、electrolytes、urine output、I/O、fluid status、HD/PD、nephrotoxic agents、renal dose adjustment。`,
    "GI bleeding": `- 請特別整理 hematemesis/melena/hematochezia、Hb trend、transfusion、EGD/colonoscopy、PPI、antiplatelet/anticoagulant adjustment。`,
    "Cellulitis / Wound": `- 請特別整理 wound appearance、cellulitis area、pus/discharge、culture、antibiotics、debridement、dressing、pain/swelling/redness trend。`,
    "Cancer / Chemotherapy": `- 請特別整理 cancer diagnosis/stage、chemotherapy regimen/cycle、side effects、infection risk、nutrition、pain control、image/lab follow-up。`,
    "Stroke / Neuro": `- 請特別整理 consciousness、limb power、NIHSS if mentioned、CT/MRI、antiplatelet/anticoagulant、swallowing、rehabilitation、discharge planning。`,
    "一般內科": `- 請依 progress notes 實際內容選擇重點，不要硬套固定段落。`,
    "其他": `- 請依 progress notes 實際內容選擇重點，不要硬套固定段落。`,
  };

  return rules[patientType] || rules["一般內科"];
}

function buildPrompt() {
  const progressNotes = getValue("progressNotes");
  const outputList = buildOutputList();
  const patientType = getValue("patientType") || "一般內科";

  if (!progressNotes) {
    setStatus("請先貼上本週 Progress Notes。", true);
    $("progressNotes").focus();
    return "";
  }

  if (outputList.length === 0) {
    setStatus("請至少選擇一個輸出項目。", true);
    return "";
  }

  const previousWeekly = getValue("previousWeekly") || "無，這可能是第一份 weekly。";
  const extraInfo = getValue("extraInfo") || "無。";

  return `你現在是一名專業的醫療病歷書寫助手，請根據以下資料，幫我整理成「${outputList.join("、")}」。

請使用我常用的英文病歷敘述格式，語氣需符合台灣臨床病歷書寫習慣，不要太像教科書摘要。

【重要原則】
1. 請以前次 Weekly Summary 作為病人住院背景與前一週狀態。
2. 請根據本週 Progress Notes 接續整理本週病程。
3. 不要完整重寫前次 weekly，除非是必要背景。
4. 重點放在本週變化、治療調整、檢驗/影像趨勢、目前狀態與後續計畫。
5. 不要捏造 progress notes 沒有提到的內容。
6. 若資料不足，請省略，不要硬補「not mentioned」。
7. 請保留重要日期、檢查、抗生素、處置、檢驗趨勢與目前用藥重點。
8. Weekly Summary 請使用英文病歷敘述格式。
9. 交班單請使用中英混合條列式，簡潔、臨床值班可用。
10. Transfer note 請使用英文病歷格式，適合病人轉出、轉入或轉院時使用。
11. 若文字中有明顯錯字或醫療英文不順，請協助修正文法與用詞。
12. 請不要輸出與病歷無關的解釋，直接給我結果。

【我常用的 Weekly Summary 風格】
This __-year-old male/female with ______ related. Because of ______, he/she was admitted for further evaluation and treatment.

After admission, ______ was impressed. ______ was arranged and showed ______. Medical treatment with ______ was given. During hospitalization, ______.

This week, the patient’s clinical condition was ______. For infection issue, ______. Antibiotic with ______ was used/continued from __/__ to __/__. Follow-up fever pattern and infection markers showed ______. Culture reports showed ______.

For respiratory condition, ______. Oxygen support with ______ was used/tapered. Follow-up CXR showed ______.

For cardiovascular condition, ______. Medication with ______ was continued/adjusted. Hemodynamic condition was ______.

For renal function and fluid status, ______. Follow-up renal function/electrolytes showed ______.

For GI/nutrition condition, ______. Diet was ______ and oral intake was ______.

For wound/tube/drain condition, ______.

Currently, the patient is ______. Vital signs were relatively stable/unstable. Keep current treatment and follow up clinical condition. Arrange further evaluation/treatment/discharge planning according to the patient’s condition.

注意：以上是寫作風格參考，不要每一段都硬塞。請依實際 progress notes 內容挑選需要的段落。

【病人類型重點】
${buildFocusRules(patientType)}

【病人基本資料】
${buildPatientSummary()}

【前次 Weekly Summary】
${previousWeekly}

【本週 Progress Notes】
${progressNotes}

【補充事項】
${extraInfo}

【請輸出格式】
${isChecked("wantWeekly") ? `一、Weekly Summary
- 使用英文病歷格式。
- 開頭請簡短帶入年齡、性別、主要診斷與入院原因。
- 若有前次 weekly，請銜接上週狀態，不要從頭重寫全部住院經過。
- 請以本週病程為主，最後寫目前狀態與後續 plan。
` : ""}
${isChecked("wantHandoff") ? `二、交班單
請使用以下格式：
病人簡介：
- 
主要問題：
- 
本週重點：
- 
目前狀態：
- Conscious:
- Vital signs:
- O2:
- Diet:
- Foley:
- Drain/tube:
- Wound:
- Antibiotics:
- Important medication:
今日需注意：
- 
待追蹤：
- Lab:
- Image:
- Culture:
- Consult:
- Procedure:
- Discharge plan:
` : ""}
${isChecked("wantTransfer") ? `三、Transfer note
請使用英文病歷格式，並依以下架構整理：
Dear Dr:
This __-year-old male/female with history of ______ was admitted due to ______.

During hospitalization, ______.
For major active problems, ______.
Important examinations/laboratory data showed ______.
Treatment with ______ was given/adjusted.
Currently, the patient is ______.

Transfer reason:
- 
Current condition:
- Conscious:
- Vital signs:
- O2/ventilator:
- Diet:
- Foley/drain/tube:
- Wound:
- Antibiotics/important medications:

Plan and suggestion:
1. 
2. 
3. 

Thank you very much.
` : ""}`.trim();
}

function generatePrompt() {
  const prompt = buildPrompt();
  if (!prompt) return;

  $("outputPrompt").value = prompt;
  setStatus("已產生 ChatGPT 指令，可以複製後貼到 ChatGPT。");
}

async function copyPrompt() {
  const text = $("outputPrompt").value.trim();

  if (!text) {
    setStatus("目前沒有可複製的指令，請先按「產生 ChatGPT 指令」。", true);
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
