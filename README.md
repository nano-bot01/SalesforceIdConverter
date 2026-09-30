# Salesforce ID Converter

Convert, validate, and bulk-process Salesforce 15 ↔ 18 character IDs.

**[Live Tool →](https://your-project.vercel.app)**  
*Replace with your actual Vercel URL after deploy.*

---

## What it does

Salesforce uses two ID formats: a 15-character case-sensitive version and an 18-character case-safe version. The last 3 characters of the 18-digit ID are a checksum computed from the casing of the first 15. This tool handles the conversion, validation, and object identification — entirely client-side, no data leaves your browser.

### Convert

Paste a 15-character ID → get the 18-character version with the computed checksum.  
Paste an 18-character ID → get the 15-character version (checksum stripped), with a warning if the checksum doesn't match.

### Validate

Paste any 18-character ID and the tool recomputes the checksum from the first 15 characters. If the suffix doesn't match, it tells you what it expected vs. what you gave — useful for catching copy-paste typos before they break a data load.

### Bulk

Paste one ID per line (mixed 15s and 18s). Get a results table with per-row conversion, object type, and status. Copy all results or download as CSV.

### Object type detection

The first 3 characters of a Salesforce ID are the key prefix, which identifies the object type. The tool recognizes common prefixes (Account, Contact, Lead, Opportunity, Case, User, etc.) and displays the type alongside each result.

### Record deep links

Paste your Salesforce My Domain (e.g. `acme.lightning.force.com`) in the domain box at the top, and every converted ID becomes a clickable link straight to the record. Domain is kept in memory only — not stored or transmitted.

---

## How the checksum works

1. Take the 15-character ID and split it into three 5-character chunks.
2. For each chunk, build a 5-bit number: bit *i* is `1` if the character at position *i* is an uppercase letter (A–Z), `0` otherwise.
3. Use that 0–31 value as an index into `ABCDEFGHIJKLMNOPQRSTUVWXYZ012345`.
4. The three resulting characters become the suffix.

This is why 18-character IDs are case-safe: the checksum encodes the casing, so even if a system (like Excel or an email client) lowercases the ID, the original casing can be recovered.

Going 18 → 15 is just truncation. Going 15 → 18 is the actual computation.

---

## Run locally

No dependencies, no build step. Clone and open.

```bash
git clone https://github.com/nano-bot01/SalesforceIdConverter.git
cd salesforce-id-converter
open index.html
```

Or use any local server:

```bash
npx serve .
```

---

## Project structure

├── index.html # Markup — three tabs, domain input, all semantic
├── styles.css # Styles — CSS variables, no framework
├── app.js # Logic — conversion, validation, bulk, CSV export
└── README.md



Single-page, zero dependencies, no framework, no build tooling. ~18 KB total.

---

## Tech

- Vanilla JavaScript — no libraries
- CSS custom properties for theming
- Runs entirely in the browser — no server, no API calls, no data transmission
- Deployed on Vercel as a static site

---

## Recognized key prefixes

| Prefix | Object             |
|--------|--------------------|
| 001    | Account            |
| 003    | Contact            |
| 005    | User               |
| 006    | Opportunity        |
| 00Q    | Lead               |
| 500    | Case               |
| 00D    | Organization       |
| 012    | Record Type        |
| 00e    | Profile            |
| 0PS    | Permission Set     |
| 701    | Campaign           |
| 800    | Contract           |
| 802    | Order              |
| 069    | ContentDocument    |
| 00T    | Task               |
| 00U    | Event              |
| 02s    | EmailMessage       |
| 0WO    | Work Order         |
| a0*    | Custom Object      |

Custom object prefixes (`a00`–`a9Z`) are org-specific and cannot be resolved without an API call, so these show a generic "Custom Object" label.

---

## License

MIT
