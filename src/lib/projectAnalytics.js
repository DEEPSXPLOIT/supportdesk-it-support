export function parseCSV(text) {
  const matrix = [];
  let row = [],
    cell = "",
    quoted = false,
    closedQuote = false;
  const source = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (closedQuote && char !== "," && char !== "\n" && char !== "\r") {
      if (/\s/.test(char)) continue;
      throw new Error("Unexpected text after a quoted CSV field.");
    }
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell !== "")
        throw new Error("Unexpected quote inside an unquoted CSV field.");
      else {
        quoted = !quoted;
        if (!quoted) closedQuote = true;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      closedQuote = false;
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.length > 1 || row.some((value) => value.trim())) matrix.push(row);
      row = [];
      cell = "";
      closedQuote = false;
    } else cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.length > 1 || row.some((value) => value.trim())) matrix.push(row);
  if (matrix.length < 2)
    throw new Error("Provide a header row and at least one data row.");
  const headers = matrix.shift().map((value) => value.trim());
  if (
    headers.some((value) => !value) ||
    new Set(headers).size !== headers.length
  )
    throw new Error("Column names must be present and unique.");
  if (matrix.length > 2000)
    throw new Error("Please use at most 2,000 data rows.");
  return matrix.map((values, index) => {
    if (values.length !== headers.length)
      throw new Error(
        `Row ${index + 2} has ${values.length} fields; expected ${headers.length}.`,
      );
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}
export function requireColumns(rows, columns) {
  if (!rows.length) throw new Error("No data rows found.");
  const missing = columns.filter((column) => !(column in rows[0]));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
}
export function toCSV(rows, columns = rows.length ? Object.keys(rows[0]) : []) {
  const escape = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return [
    columns.map(escape).join(","),
    ...rows.map((row) =>
      columns.map((column) => escape(row[column])).join(","),
    ),
  ].join("\r\n");
}
export const SLA_HOURS = { P1: 4, P2: 8, P3: 24, P4: 48 };
export function summarizeTickets(rows) {
  const open = rows.filter((row) => row.status !== "Resolved");
  return {
    total: rows.length,
    open: open.length,
    resolved: rows.length - open.length,
    breached: open.filter((row) => row.ageHours > SLA_HOURS[row.priority])
      .length,
  };
}
export function auditRows(rows) {
  requireColumns(rows, ["id", "name", "email", "department"]);
  const seen = new Set(),
    clean = [],
    issues = [];
  let duplicates = 0,
    invalid = 0;
  rows.forEach((record, index) => {
    const normalized = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, String(value).trim()]),
    );
    normalized.email = normalized.email.toLowerCase();
    const problems = ["id", "name", "email", "department"]
      .filter((key) => !normalized[key])
      .map((key) => `Missing ${key}`);
    if (
      normalized.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)
    )
      problems.push("Invalid email");
    if (problems.length) invalid++;
    else if (seen.has(normalized.id)) {
      problems.push("Duplicate ID");
      duplicates++;
    } else {
      seen.add(normalized.id);
      clean.push(normalized);
    }
    if (problems.length)
      issues.push({
        row: index + 2,
        id: normalized.id,
        issue: problems.join("; "),
      });
  });
  return { clean, issues, duplicates, invalid, total: rows.length };
}
const numeric = (value) =>
  String(value).trim() !== "" && Number.isFinite(Number(value));
const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export function validateSales(rows) {
  requireColumns(rows, [
    "order_id",
    "date",
    "region",
    "product",
    "quantity",
    "unit_price",
  ]);
  return rows.map((row, index) => {
    const item = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, String(v).trim()]),
    );
    if (
      !item.order_id ||
      !item.region ||
      !item.product ||
      !validDate(item.date) ||
      !numeric(item.quantity) ||
      Number(item.quantity) <= 0 ||
      !Number.isInteger(Number(item.quantity)) ||
      !numeric(item.unit_price) ||
      Number(item.unit_price) < 0 ||
      !Number.isFinite(Number(item.quantity) * Number(item.unit_price))
    )
      throw new Error(
        `Invalid sales data at CSV row ${index + 2}. Check identifiers, ISO date, positive integer quantity, and nonnegative price.`,
      );
    return {
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    };
  });
}
export function analyzeSales(rows, region = "All") {
  const filtered = rows.filter(
    (row) => region === "All" || row.region === region,
  );
  const orders = new Set(),
    monthly = Object.create(null),
    products = Object.create(null);
  let revenue = 0,
    units = 0;
  filtered.forEach((row) => {
    const amount = row.quantity * row.unit_price;
    revenue += amount;
    units += row.quantity;
    orders.add(row.order_id);
    const month = row.date.slice(0, 7);
    monthly[month] = (monthly[month] || 0) + amount;
    products[row.product] ||= { product: row.product, revenue: 0, units: 0 };
    products[row.product].revenue += amount;
    products[row.product].units += row.quantity;
  });
  return {
    filtered,
    revenue,
    units,
    orders: orders.size,
    averageOrderValue: orders.size ? revenue / orders.size : 0,
    monthly: Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue })),
    products: Object.values(products).sort((a, b) => b.revenue - a.revenue),
  };
}
export function validateLogs(rows) {
  requireColumns(rows, ["request_id", "endpoint", "status", "latency_ms"]);
  return rows.map((row, index) => {
    const item = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, String(v).trim()]),
    );
    if (
      !item.request_id ||
      !item.endpoint.startsWith("/") ||
      !numeric(item.status) ||
      !Number.isInteger(Number(item.status)) ||
      Number(item.status) < 100 ||
      Number(item.status) > 599 ||
      !numeric(item.latency_ms) ||
      Number(item.latency_ms) < 0
    )
      throw new Error(
        `Invalid request log at CSV row ${index + 2}. Use HTTP status 100–599 and nonnegative latency.`,
      );
    return {
      ...item,
      status: Number(item.status),
      latency_ms: Number(item.latency_ms),
    };
  });
}
export function percentile95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.ceil(sorted.length * 0.95) - 1] : 0;
}
export function analyzeLogs(rows) {
  const groups = Object.create(null);
  rows.forEach((row) => {
    (groups[row.endpoint] ||= []).push(row);
  });
  const errors = rows.filter((row) => row.status >= 400).length;
  return {
    total: rows.length,
    errors,
    errorRate: rows.length ? (errors / rows.length) * 100 : 0,
    p95: percentile95(rows.map((row) => row.latency_ms)),
    endpoints: Object.entries(groups).map(([endpoint, items]) => ({
      endpoint,
      requests: items.length,
      errors: items.filter((row) => row.status >= 400).length,
      p95_ms: percentile95(items.map((row) => row.latency_ms)),
      mean_ms: Math.round(
        items.reduce((sum, row) => sum + row.latency_ms, 0) / items.length,
      ),
    })),
  };
}
