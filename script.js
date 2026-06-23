const $ = (id) => document.getElementById(id);

function processNotes() {
    const rawNotes = getValue("progressNotes");
    if (!rawNotes) {
        setStatus("請貼上本週的 Progress Notes", true);
        return;
    }

    // 簡單的關鍵字擷取與歸納邏輯
    const lines = rawNotes.split('\n');
    let vitals = [], labs = [], plan = [], findings = [];

    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('vs') || lower.includes('bp') || lower.includes('hr') || lower.includes('spo2')) vitals.push(line);
        else if (lower.includes('crp') || lower.includes('wbc') || lower.includes('hb') || lower.includes('cr')) labs.push(line);
        else if (lower.includes('plan') || lower.includes('continue') || lower.includes('shift')) plan.push(line);
        else if (lower.includes('cxr') || lower.includes('ct') || lower.includes('echo')) findings.push(line);
    });

    // 格式化輸出
    const output = `【Weekly Summary - ${getValue("weekRange") || 'Current Week'}】
Patient: ${getValue("age") || '---'}y/o ${getValue("sex") || '---'}, admitted for ${getValue("admissionReason") || '---'}.
Diagnosis: ${getValue("diagnosis") || '---'}.

[Clinical Course]
${rawNotes.substring(0, 500)}... (請在此處簡述本週病程演變)

[Key Trends]
- Vitals: ${vitals.slice(-3).join(', ')}
- Labs: ${labs.slice(-3).join(', ')}
- Imaging: ${findings.join(', ')}

[Plan]
${plan.join('\n- ')}

---------------------------------------------
【交班單】
- Patient: ${getValue("diagnosis") || '---'}
- Status: Stable / Unstable
- Important events: ${getValue("extraInfo") || 'None'}
- Pending: 
`;

    $("outputPrompt").value = output;
    setStatus("已完成歸納，直接複製貼上即可。");
}

function getValue(id) { return $(id)?.value.trim() || ""; }
function setStatus(msg, isErr) { 
    $("status").textContent = msg; 
    $("status").style.color = isErr ? "red" : "green"; 
}

// 綁定按鈕 (記得在 HTML 檢查按鈕 ID 是否為 generateBtn)
$("generateBtn").onclick = processNotes;
