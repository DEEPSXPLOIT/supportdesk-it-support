import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
const load = async (path) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        await readFile(new URL(path, import.meta.url), "utf8"),
      ).toString("base64")
  );
const a = await load("../src/lib/projectAnalytics.js");
const d = await load("../src/data/demoData.js");
test("CSV handles BOM, CRLF, escaped quotes, commas, and multiline fields", () => {
  const rows = a.parseCSV(
    '\uFEFFid,note\r\n1,"Hello, ""world"""\r\n2,"two\nlines"\r\n',
  );
  assert.deepEqual(rows, [
    { id: "1", note: 'Hello, "world"' },
    { id: "2", note: "two\nlines" },
  ]);
});
test("CSV rejects duplicate headers, ragged rows, unclosed quotes, trailing quoted garbage, and oversized datasets", () => {
  for (const csv of [
    "id,id\n1,2",
    "id,name\n1",
    'id,name\n1,"bad',
    'id,name\n1,"value"garbage',
  ])
    assert.throws(() => a.parseCSV(csv));
  assert.throws(
    () =>
      a.parseCSV("id\n" + Array.from({ length: 2001 }, (_, i) => i).join("\n")),
    /2,000/,
  );
});
test("CSV export escapes quotes and neutralizes formula prefixes", () => {
  const csv = a.toCSV([{ name: "=SUM(A1:A2)", note: 'Hello, "world"' }]);
  assert.equal(a.parseCSV(csv)[0].name, "'=SUM(A1:A2)");
  assert.equal(a.parseCSV(csv)[0].note, 'Hello, "world"');
});
test("SLA counts only unresolved breaches and respects exact target boundary", () => {
  assert.deepEqual(a.summarizeTickets(d.tickets), {
    total: 6,
    open: 5,
    resolved: 1,
    breached: 3,
  });
  assert.equal(
    a.summarizeTickets([
      { status: "Open", priority: "P1", ageHours: 4 },
      { status: "Resolved", priority: "P1", ageHours: 8 },
    ]).breached,
    0,
  );
});
