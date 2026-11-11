document.addEventListener("DOMContentLoaded", function () {

  "use strict";

  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
  var VALID = /^[a-zA-Z0-9]+$/;

  var PREFIXES = {
    "001":"Account","003":"Contact","005":"User","006":"Opportunity",
    "00Q":"Lead","500":"Case","00D":"Organization","012":"Record Type",
    "00e":"Profile","0PS":"Permission Set","701":"Campaign","800":"Contract",
    "802":"Order","069":"ContentDocument","00T":"Task","00U":"Event",
    "02s":"EmailMessage","0WO":"Work Order","a0":"Custom Object"
  };

  function objectType(id) {
    if (id.length < 3) return null;
    var p3 = id.slice(0, 3);
    if (PREFIXES[p3]) return PREFIXES[p3];
    var p2 = id.slice(0, 2);
    if (PREFIXES[p2]) return PREFIXES[p2];
    return null;
  }

  function to18(id15) {
    var suffix = "";
    for (var chunk = 0; chunk < 3; chunk++) {
      var value = 0;
      for (var i = 0; i < 5; i++) {
        var c = id15.charAt(chunk * 5 + i);
        if (c >= "A" && c <= "Z") value += 1 << i;
      }
      suffix += CHARS.charAt(value);
    }
    return id15 + suffix;
  }

  function isValid18(id18) {
    return to18(id18.slice(0, 15)).slice(15).toUpperCase() === id18.slice(15).toUpperCase();
  }

  var domain = "";
  var domainEl = document.getElementById("domain");
  domainEl.addEventListener("input", function () {
    domain = domainEl.value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    convertSingle();
    renderValidate();
  });

  function recordLink(id) {
    if (!domain || !id) return null;
    return "https://" + domain + "/" + id;
  }

  function setMeta(el, cls, text) { el.className = "meta " + cls; el.textContent = text; }

  // ---------- tabs ----------
  var tabs = document.querySelectorAll(".tab");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      document.getElementById(t.dataset.panel).classList.add("active");
    });
  });

  // ---------- single ----------
  var inputEl = document.getElementById("input");
  var outputEl = document.getElementById("output");
  var inMeta = document.getElementById("inputMeta");
  var outMeta = document.getElementById("outputMeta");
  var copyBtn = document.getElementById("copy");
  var swapBtn = document.getElementById("swap");
  var singleLink = document.getElementById("singleLink");

  function showLink(el, id) {
    var url = recordLink(id);
    if (url) {
      el.className = "link-out";
      el.innerHTML = '&#8599; <a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>";
    } else if (!domain) {
      el.className = "link-out empty";
      el.textContent = "Add a domain above to get a clickable record link.";
    } else {
      el.className = "link-out empty";
      el.textContent = "";
    }
  }

  function typeSuffix(id) {
    var t = objectType(id);
    return t ? '  \u2014  ' + t : "";
  }

  function convertSingle() {
    var raw = inputEl.value.trim();
    if (raw === "") {
      outputEl.value = ""; setMeta(outMeta, "hint", ""); copyBtn.disabled = true;
      inputEl.classList.remove("invalid"); setMeta(inMeta, "hint", "Waiting for input");
      showLink(singleLink, ""); return;
    }
    if (!VALID.test(raw)) {
      outputEl.value = ""; setMeta(outMeta, "hint", ""); copyBtn.disabled = true;
      inputEl.classList.add("invalid"); setMeta(inMeta, "err", "Only letters and numbers are allowed");
      showLink(singleLink, ""); return;
    }
    if (raw.length === 15) {
      inputEl.classList.remove("invalid");
      setMeta(inMeta, "ok", "15 characters" + typeSuffix(raw));
      outputEl.value = to18(raw);
      setMeta(outMeta, "ok", "18-character ID (checksum added)");
      copyBtn.disabled = false; showLink(singleLink, outputEl.value); return;
    }
    if (raw.length === 18) {
      inputEl.classList.remove("invalid");
      var ok = isValid18(raw);
      setMeta(inMeta, ok ? "ok" : "err",
        "18 characters" + typeSuffix(raw) + (ok ? "" : "  \u2014  checksum mismatch, check the Validate tab"));
      outputEl.value = raw.slice(0, 15);
      setMeta(outMeta, "ok", "15-character ID (checksum removed)");
      copyBtn.disabled = false; showLink(singleLink, raw); return;
    }
    outputEl.value = ""; setMeta(outMeta, "hint", ""); copyBtn.disabled = true;
    inputEl.classList.add("invalid");
    setMeta(inMeta, "err", raw.length + " characters \u2014 need 15 or 18");
    showLink(singleLink, "");
  }

  inputEl.addEventListener("input", convertSingle);
  copyBtn.addEventListener("click", function () { copyText(outputEl.value, copyBtn); });
  swapBtn.addEventListener("click", function () {
    if (!outputEl.value) return; inputEl.value = outputEl.value; convertSingle(); inputEl.focus();
  });

  // ---------- validate ----------
  var valInput = document.getElementById("valInput");
  var valMeta = document.getElementById("valMeta");
  var valLink = document.getElementById("valLink");

  function renderValidate() {
    var raw = valInput.value.trim();
    if (raw === "") {
      valInput.classList.remove("invalid");
      setMeta(valMeta, "hint", "Recomputes the checksum from the first 15 characters");
      showLink(valLink, ""); return;
    }
    if (!VALID.test(raw)) {
      valInput.classList.add("invalid"); setMeta(valMeta, "err", "Only letters and numbers are allowed");
      showLink(valLink, ""); return;
    }
    if (raw.length !== 18) {
      valInput.classList.add("invalid");
      setMeta(valMeta, "err", raw.length + " characters \u2014 a valid ID to check must be 18");
      showLink(valLink, ""); return;
    }
    var ok = isValid18(raw);
    valInput.classList.toggle("invalid", !ok);
    var expected = to18(raw.slice(0, 15)).slice(15);
    if (ok) {
      setMeta(valMeta, "ok", "Valid" + typeSuffix(raw) + "  \u2014  checksum matches");
      showLink(valLink, raw);
    } else {
      setMeta(valMeta, "err", "Invalid checksum \u2014 expected suffix " + expected + " but got " + raw.slice(15));
      showLink(valLink, "");
    }
  }
  valInput.addEventListener("input", renderValidate);

  // ---------- bulk convert ----------
  var bulkInput = document.getElementById("bulkInput");
  var bulkRun = document.getElementById("bulkRun");
  var bulkCopy = document.getElementById("bulkCopy");
  var bulkCsv = document.getElementById("bulkCsv");
  var bulkMeta = document.getElementById("bulkMeta");
  var bulkWrap = document.getElementById("bulkResultWrap");
  var bulkRows = [];

  function processBulk() {
    var lines = bulkInput.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l !== ""; });
    bulkRows = lines.map(function (raw) {
      if (!VALID.test(raw)) return { input: raw, output: "", type: "", status: "invalid chars" };
      if (raw.length === 15) return { input: raw, output: to18(raw), type: objectType(raw) || "", status: "15\u219218" };
      if (raw.length === 18) {
        var ok = isValid18(raw);
        return { input: raw, output: raw.slice(0, 15), type: objectType(raw) || "", status: ok ? "18\u219215 (valid)" : "18\u219215 (BAD checksum)" };
      }
      return { input: raw, output: "", type: "", status: "wrong length" };
    });

    if (bulkRows.length === 0) {
      bulkWrap.innerHTML = ""; setMeta(bulkMeta, "hint", "Nothing to convert");
      bulkCopy.disabled = true; bulkCsv.disabled = true; return;
    }

    var bad = bulkRows.filter(function (r) { return /invalid|wrong|BAD/.test(r.status); }).length;
    var html = "<table><thead><tr><th>Input</th><th>Output</th><th>Type</th><th>Status</th></tr></thead><tbody>";
    bulkRows.forEach(function (r) {
      var good = !/invalid|wrong|BAD/.test(r.status);
      html += "<tr><td>" + esc(r.input) + "</td><td>" + esc(r.output) + "</td><td>" + esc(r.type) +
        '</td><td class="' + (good ? "status-ok" : "status-err") + '">' + esc(r.status) + "</td></tr>";
    });
    html += "</tbody></table>";
    bulkWrap.innerHTML = html;
    setMeta(bulkMeta, bad ? "err" : "ok", bulkRows.length + " processed" + (bad ? ", " + bad + " with problems" : ", all clean"));
    bulkCopy.disabled = false; bulkCsv.disabled = false;
  }

  bulkRun.addEventListener("click", processBulk);
  bulkCopy.addEventListener("click", function () {
    var txt = bulkRows.map(function (r) { return r.output || r.input; }).join("\n");
    copyText(txt, bulkCopy);
  });
  bulkCsv.addEventListener("click", function () {
    var rows = [["input", "output", "type", "status"]].concat(bulkRows.map(function (r) { return [r.input, r.output, r.type, r.status]; }));
    var csv = rows.map(function (row) { return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "salesforce-ids.csv"; a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---------- smart bulk cleaner ----------
  var cleanInput = document.getElementById("cleanInput");
  var cleanRun = document.getElementById("cleanRun");
  var cleanCopy = document.getElementById("cleanCopy");
  var cleanMeta = document.getElementById("cleanMeta");
  var cleanWrap = document.getElementById("cleanResultWrap");
  var cleanRows = [];

  // Regex: match 15 or 18 alphanumeric chars that look like SF IDs 
  var SF_ID_RE = /[^a-zA-Z0-9]([a-zA-Z0-9]{18})|[^a-zA-Z0-9]([a-zA-Z0-9]{15})(?![a-zA-Z0-9])/g;

  function isSfId(s) {
    if (s.length !== 15 && s.length !== 18) return false;
    if (!/^[a-zA-Z0-9]+$/.test(s)) return false;
    if (/^[0-9]+$/.test(s)) return false;
    return true;
  }

  function extractIds(text) {
    var seen = {};
    var results = [];
    // Split on any character that can precede an ID: / space , newline tab
    var tokens = text.split(/[\/\s,]+/);
    tokens.forEach(function(token) {
      // Strip any trailing non-alphanumeric (e.g. punctuation after ID)
      token = token.replace(/[^a-zA-Z0-9]+$/, '');
      if (token.length === 18 && isSfId(token)) {
        var key = token.toUpperCase();
        if (!seen[key]) { seen[key] = true; results.push(token); }
      } else if (token.length === 15 && isSfId(token)) {
        var key = token.toUpperCase();
        if (!seen[key]) { seen[key] = true; results.push(token); }
      }
    });
    return results;
  }  


  function processClean() {
    var text = cleanInput.value;
    if (!text.trim()) {
      cleanWrap.innerHTML = "";
      setMeta(cleanMeta, "hint", "Nothing to scan");
      cleanCopy.disabled = true;
      return;
    }

    var found = extractIds(text);
    cleanRows = found.map(function (id) {
      var is18 = id.length === 18;
      var id18 = is18 ? id : to18(id);
      var valid = is18 ? isValid18(id) : true;
      return {
        raw: id,
        id18: id18,
        type: objectType(id) || "Unknown",
        length: id.length,
        valid: valid
      };
    });

    if (cleanRows.length === 0) {
      cleanWrap.innerHTML = '<p class="meta hint" style="margin-top:0.8rem">No Salesforce IDs found in the pasted text.</p>';
      setMeta(cleanMeta, "hint", "No IDs detected");
      cleanCopy.disabled = true;
      return;
    }

    var html = "<table><thead><tr><th>Extracted ID</th><th>18-char</th><th>Object</th><th>Status</th></tr></thead><tbody>";
    cleanRows.forEach(function (r) {
      var statusText = r.length === 15 ? "15-char" : (r.valid ? "18-char \u2713" : "18-char BAD checksum");
      var statusCls = (!r.valid) ? "status-err" : "status-ok";
      html += "<tr><td>" + esc(r.raw) + "</td><td>" + esc(r.id18) + "</td><td>" + esc(r.type) +
        '</td><td class="' + statusCls + '">' + esc(statusText) + "</td></tr>";
    });
    html += "</tbody></table>";
    cleanWrap.innerHTML = html;
    setMeta(cleanMeta, "ok", cleanRows.length + " ID " + (cleanRows.length !== 1 ? "s" : "") + " extracted");
    cleanCopy.disabled = false;
  }

  cleanRun.addEventListener("click", processClean);
  cleanCopy.addEventListener("click", function () {
    var txt = cleanRows.map(function (r) { return r.id18; }).join("\n");
    copyText(txt, cleanCopy);
  });

  // ---------- SOQL IN clause ----------
  var soqlInput = document.getElementById("soqlInput");
  var soqlField = document.getElementById("soqlField");
  var soqlFormatted = document.getElementById("soqlFormatted");
  var soqlGenerate = document.getElementById("soqlGenerate");
  var soqlCopySingle = document.getElementById("soqlCopySingle");
  var soqlCopyFormatted = document.getElementById("soqlCopyFormatted");
  var soqlMeta = document.getElementById("soqlMeta");
  var soqlSingleOut = document.getElementById("soqlSingleOut");
  var soqlFormattedOut = document.getElementById("soqlFormattedOut");
  var soqlResults = document.getElementById("soqlResults");

  function generateSoql() {
    var lines = soqlInput.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l !== ""; });
    var field = soqlField.value.trim() || "Id";

    var ids = [];
    var seen = {};
    lines.forEach(function (raw) {
      if (!VALID.test(raw)) return;
      if (raw.length !== 15 && raw.length !== 18) return;
      var id18 = raw.length === 15 ? to18(raw) : raw;
      var key = id18.toUpperCase();
      if (!seen[key]) { seen[key] = true; ids.push(id18); }
    });

    if (ids.length === 0) {
      setMeta(soqlMeta, "hint", "No valid IDs found");
      soqlResults.style.display = "none";
      return;
    }

    var quoted = ids.map(function (id) { return "'" + id + "'"; });

    // Single line
    var single = "WHERE " + field + " IN (" + quoted.join(", ") + ")";

    // Formatted (one ID per line, indented)
    var formatted = "WHERE " + field + " IN (\n" + quoted.map(function (q) { return "    " + q; }).join(",\n") + "\n)";

    soqlSingleOut.textContent = single;
    soqlFormattedOut.textContent = formatted;
    soqlResults.style.display = "block";
    setMeta(soqlMeta, "ok", ids.length + " ID" + (ids.length !== 1 ? "s" : "") + " — duplicates will be removed");
    soqlCopySingle.disabled = false;
    soqlCopyFormatted.disabled = false;
  }

  soqlGenerate.addEventListener("click", generateSoql);
  soqlCopySingle.addEventListener("click", function () {
    copyText(soqlSingleOut.textContent, soqlCopySingle);
  });
  soqlCopyFormatted.addEventListener("click", function () {
    copyText(soqlFormattedOut.textContent, soqlCopyFormatted);
  });

  // ---------- explain ID ----------
  var explainInput = document.getElementById("explainInput");
  var explainWrap = document.getElementById("explainWrap");

  function renderExplain() {
    var raw = explainInput.value.trim();
    explainWrap.innerHTML = "";

    if (raw === "") return;

    if (!VALID.test(raw)) {
      explainWrap.innerHTML = '<p class="meta err">Only letters and numbers are allowed.</p>';
      return;
    }

    if (raw.length !== 15 && raw.length !== 18) {
      explainWrap.innerHTML = '<p class="meta err">' + raw.length + ' characters — need 15 or 18.</p>';
      return;
    }

    var id15 = raw.slice(0, 15);
    var id18 = raw.length === 18 ? raw : to18(raw);
    var is18Input = raw.length === 18;
    var checksumValid = isValid18(id18);
    var expectedSuffix = to18(id15).slice(15);
    var actualSuffix = id18.slice(15);
    var prefix = raw.slice(0, 3);
    var objType = objectType(raw);

    var rows = [
      ["Input length", raw.length + " characters (" + (is18Input ? "18-char" : "15-char") + " ID)"],
      ["Object prefix", prefix],
      ["Detected object", objType || "Unknown / Custom Object"],
      ["Base record ID", '<span class="explain-mono">' + esc(id15) + '</span>'],
      ["Checksum section", '<span class="explain-mono">' + esc(actualSuffix) + '</span>' + (is18Input ? "" : ' <span class="meta hint">(computed)</span>')],
      ["18-char ID", '<span class="explain-mono">' + esc(id18) + '</span>'],
      ["Checksum valid", checksumValid
        ? '<span class="meta ok">\u2713 Valid — suffix matches expected <code>' + esc(expectedSuffix) + '</code></span>'
        : '<span class="meta err">\u2717 Invalid — expected <code>' + esc(expectedSuffix) + '</code>, got <code>' + esc(actualSuffix) + '</code></span>'
      ],
    ];

    var html = '<div class="explain-card">';
    rows.forEach(function (r) {
      html += '<div class="explain-row"><span class="explain-label">' + esc(r[0]) + '</span><span class="explain-value">' + r[1] + '</span></div>';
    });
    html += '</div>';

    // Visual breakdown
    html += '<div class="explain-visual">';
    html += '<div class="explain-visual-label">ID anatomy</div>';
    html += '<div class="explain-segments">';
    html += '<span class="seg seg-prefix" title="Object prefix">' + esc(id18.slice(0, 3)) + '</span>';
    html += '<span class="seg seg-body" title="Record identifier">' + esc(id18.slice(3, 15)) + '</span>';
    html += '<span class="seg seg-checksum ' + (checksumValid ? "" : "seg-bad") + '" title="Checksum suffix">' + esc(id18.slice(15)) + '</span>';
    html += '</div>';
    html += '<div class="explain-seg-labels">';
    html += '<span>prefix</span><span>record identifier</span><span>checksum</span>';
    html += '</div>';
    html += '</div>';

    explainWrap.innerHTML = html;
  }

  explainInput.addEventListener("input", renderExplain);

  // ---------- shared ----------
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function copyText(text, btn) {
    if (!text) return;
    var orig = btn.textContent;
    var restore = function () { btn.textContent = orig; };
    btn.textContent = "Copied";
    setTimeout(restore, 1200);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
    } else { legacyCopy(text); }
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  inputEl.focus();
});
