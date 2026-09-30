document.addEventListener("DOMContentLoaded", function () {
  
    "use strict";
  
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
    var VALID = /^[a-zA-Z0-9]+$/;
  
    // Common key prefixes -> object type
    var PREFIXES = {
      "001":"Account","003":"Contact","005":"User","006":"Opportunity",
      "00Q":"Lead","500":"Case","00D":"Organization","012":"Record Type",
      "00e":"Profile","0PS":"Permission Set","701":"Campaign","800":"Contract",
      "802":"Order","a0":"Custom Object","069":"ContentDocument",
      "00T":"Task","00U":"Event","02s":"EmailMessage","0WO":"Work Order"
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
      return t ? '  \u2014  ' + t : "";
    }
  
    function convertSingle() {
      var raw = inputEl.value.trim();
      if (raw === "") { outputEl.value = ""; setMeta(outMeta, "hint", ""); copyBtn.disabled = true;
        inputEl.classList.remove("invalid"); setMeta(inMeta, "hint", "Waiting for input"); showLink(singleLink, ""); return; }
      if (!VALID.test(raw)) { outputEl.value = ""; setMeta(outMeta, "hint", ""); copyBtn.disabled = true;
        inputEl.classList.add("invalid"); setMeta(inMeta, "err", "Only letters and numbers are allowed"); showLink(singleLink, ""); return; }
  
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
          "18 characters" + typeSuffix(raw) + (ok ? "" : "  \u2014  checksum mismatch, check the Validate tab"));
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
      if (raw === "") { valInput.classList.remove("invalid");
        setMeta(valMeta, "hint", "Recomputes the checksum from the first 15 characters"); showLink(valLink, ""); return; }
      if (!VALID.test(raw)) { valInput.classList.add("invalid"); setMeta(valMeta, "err", "Only letters and numbers are allowed"); showLink(valLink, ""); return; }
      if (raw.length !== 18) { valInput.classList.add("invalid");
        setMeta(valMeta, "err", raw.length + " characters \u2014 a valid ID to check must be 18"); showLink(valLink, ""); return; }
      var ok = isValid18(raw);
      valInput.classList.toggle("invalid", !ok);
      var expected = to18(raw.slice(0, 15)).slice(15);
      if (ok) { setMeta(valMeta, "ok", "Valid" + typeSuffix(raw) + "  \u2014  checksum matches"); showLink(valLink, raw); }
      else { setMeta(valMeta, "err", "Invalid checksum \u2014 expected suffix " + expected + " but got " + raw.slice(15)); showLink(valLink, ""); }
    }
    valInput.addEventListener("input", renderValidate);
  
    // ---------- bulk ----------
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
  
      if (bulkRows.length === 0) { bulkWrap.innerHTML = ""; setMeta(bulkMeta, "hint", "Nothing to convert"); bulkCopy.disabled = true; bulkCsv.disabled = true; return; }
  
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
  
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); }
  
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
  
    // ---------- shared copy ----------
    function copyText(text, btn) {
      if (!text) return;
      var restore = function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(restore).catch(function () { legacyCopy(text); restore(); });
      } else { legacyCopy(text); restore(); }
    }
    function legacyCopy(text) {
      var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta);
    }
    inputEl.focus();
});