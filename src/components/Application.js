"use client";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { tickets as seedTickets } from "@/data/demoData";
import {
  parseCSV,
  toCSV,
  auditRows,
  validateSales,
  analyzeSales,
  validateLogs,
  analyzeLogs,
  summarizeTickets,
  SLA_HOURS,
} from "@/lib/projectAnalytics";
import { project } from "@/data/project";
const Shell = styled.main`
  max-width: 1120px;
  margin: auto;
  padding: 48px 24px 80px;
  color: ${({ theme }) => theme.colors.text};
  h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    letter-spacing: -0.05em;
    margin: 20px 0;
  }
  h2 {
    font-size: 1.3rem;
    margin-bottom: 18px;
  }
  h3 {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.7;
  }
  a {
    color: ${({ theme }) => theme.colors.accentDark};
  }
  input,
  select {
    font: inherit;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.inputBg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 11px;
    border-radius: 8px;
    min-width: 0;
    width: 100%;
  }
  button {
    color: ${({ theme }) => theme.colors.text};
    padding: 11px 15px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    min-height: 44px;
  }
  button:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  label {
    font-size: 0.8rem;
    display: grid;
    gap: 8px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  code {
    overflow-wrap: anywhere;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.accentDark};
  }
  form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    align-items: end;
  }
`;
const Badge = styled.span`
  display: inline-block;
  padding: 7px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 100px;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.accentDark};
  margin-top: 24px;
`;
const Panel = styled.section`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  margin: 24px 0;
  min-width: 0;
  @media (max-width: 500px) {
    padding: 18px;
  }
`;
const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
  > div {
    min-width: 0;
  }
  ul {
    list-style: disc;
    padding-inline-start: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.9rem;
    line-height: 1.9;
  }
  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;
const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0;
  div {
    padding: 18px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.bgSecondary};
  }
  strong {
    display: block;
    font-size: clamp(1.1rem, 3vw, 1.9rem);
    overflow-wrap: anywhere;
  }
  span {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  @media (max-width: 650px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const Toolbar = styled.div`
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
  label {
    flex: 1;
    min-width: 140px;
  }
  button {
    flex-shrink: 0;
  }
`;
const TableWrap = styled.div`
  overflow-x: auto;
  max-width: 100%;
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  th {
    text-align: start;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  td,
  th {
    padding: 14px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
  }
  td select {
    min-width: 120px;
  }
  caption {
    text-align: start;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    padding: 10px;
  }
  .warn {
    color: #ef9164;
  }
`;
const Notice = styled.p`
  font-size: 0.85rem;
  margin: 12px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;
const Bars = styled.div`
  display: grid;
  gap: 16px;
  div > span {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 6px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  i {
    display: block;
    height: 8px;
    background: linear-gradient(90deg, #818cf8, #38bdf8);
    border-radius: 8px;
  }
`;
const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
function download(name, rows, columns) {
  const blob = new Blob([toCSV(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function MetricRow({ items }) {
  return (
    <Metrics>
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </Metrics>
  );
}
function Table({ rows, columns, caption }) {
  return (
    <TableWrap>
      <table>
        <caption>
          {caption}
          {rows.length > 30
            ? " · Showing first 30 rows; exports include all results."
            : ""}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row, index) => (
            <tr key={index}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Notice>No records match this view.</Notice>}
    </TableWrap>
  );
}
function useLocalRows(key, seed, valid) {
  const [rows, setRows] = useState(() => seed.map((row) => ({ ...row })));
  const [loaded, setLoaded] = useState(false);
  const [storage, setStorage] = useState("Loading browser-local records…");
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(stored) && stored.every(valid)) setRows(stored);
    } catch {}
    setLoaded(true);
  }, [key, valid]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(rows));
      setStorage("Changes saved in this browser only.");
    } catch {
      setStorage(
        "Browser storage is unavailable. Changes will last only for this session.",
      );
    }
  }, [rows, key, loaded]);
  return [
    rows,
    setRows,
    () => setRows(seed.map((row) => ({ ...row }))),
    storage,
    loaded,
  ];
}
const validTicket = (row) =>
  row &&
  typeof row.id === "string" &&
  typeof row.subject === "string" &&
  typeof row.category === "string" &&
  Object.hasOwn(SLA_HOURS, row.priority) &&
  ["Open", "In progress", "Resolved"].includes(row.status) &&
  Number.isFinite(row.ageHours) &&
  row.ageHours >= 0;
const validAsset = (row) =>
  row &&
  ["tag", "owner", "location", "model", "warranty"].every(
    (k) => typeof row[k] === "string",
  ) &&
  ["Deployed", "Available", "Repair", "Retired"].includes(row.status);
function TicketDemo() {
  const [rows, setRows, reset, storage, loaded] = useLocalRows(
    "supportdesk-records-v1",
    seedTickets,
    validTicket,
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [notice, setNotice] = useState("");
  const metrics = summarizeTickets(rows);
  const visible = rows.filter(
    (row) =>
      (status === "All" || row.status === status) &&
      (row.subject + " " + row.id + " " + row.category)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function add(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = String(data.get("subject")).trim();
    if (!subject) {
      setNotice("Enter an incident description.");
      return;
    }
    setRows([
      ...rows,
      {
        id: "INC-" + crypto.randomUUID().slice(0, 8),
        subject,
        category: data.get("category"),
        priority: data.get("priority"),
        status: "Open",
        ageHours: 0,
      },
    ]);
    e.currentTarget.reset();
    setNotice("Ticket added to the local demo queue.");
  }
  return (
    <>
      <MetricRow
        items={[
          ["Total tickets", metrics.total],
          ["Active tickets", metrics.open],
          ["Active SLA breaches", metrics.breached],
          ["Resolved tickets", metrics.resolved],
        ]}
      />
      <Panel>
        <h2>Create a support ticket</h2>
        <form onSubmit={add}>
          <label>
            Incident description
            <input
              name="subject"
              required
              maxLength={150}
              placeholder="Describe the issue"
            />
          </label>
          <label>
            Category
            <select name="category">
              {["Access", "ERP", "Hardware", "Network", "Software"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority">
              {Object.entries(SLA_HOURS).map(([key, hours]) => (
                <option value={key} key={key}>
                  {key} · {hours}h target
                </option>
              ))}
            </select>
          </label>
          <button disabled={!loaded} type="submit">
            Create ticket
          </button>
        </form>
        <Notice role="status">{notice}</Notice>
      </Panel>
      <Panel>
        <h2>Incident queue</h2>
        <Toolbar>
          <label>
            Search incidents
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Subject, category, or ticket ID"
            />
          </label>
          <label>
            Ticket status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {["All", "Open", "In progress", "Resolved"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button onClick={() => download("support-queue.csv", visible)}>
            Export queue
          </button>
          <button
            onClick={() => {
              reset();
              setNotice("Sample queue restored.");
            }}
          >
            Reset sample
          </button>
        </Toolbar>
        <Table
          caption="Support incidents · fixed scenario ages"
          rows={visible}
          columns={[
            { key: "id", label: "Ticket" },
            { key: "subject", label: "Issue" },
            { key: "priority", label: "Priority" },
            { key: "ageHours", label: "Age (hours)" },
            {
              key: "sla",
              label: "SLA",
              render: (row) => (
                <span
                  className={
                    row.ageHours > SLA_HOURS[row.priority] ? "warn" : ""
                  }
                >
                  {row.status === "Resolved"
                    ? "Closed"
                    : row.ageHours > SLA_HOURS[row.priority]
                      ? "Breached"
                      : `${SLA_HOURS[row.priority] - row.ageHours}h remaining`}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <select
                  aria-label={`Status for ${row.id}`}
                  value={row.status}
                  onChange={(e) =>
                    setRows(
                      rows.map((item) =>
                        item.id === row.id
                          ? { ...item, status: e.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  {["Open", "In progress", "Resolved"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              ),
            },
          ]}
        />
        <Notice>
          {storage} SLA targets: P1 4h, P2 8h, P3 24h, P4 48h. Ages are
          simulated and do not advance with real time.
        </Notice>
      </Panel>
    </>
  );
}
export default function Application() {
  return (
    <Shell lang="en">
      <header>
        <a
          href="https://github.com/DEEPSXPLOIT/supportdesk-it-support"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub ↗
        </a>
        <p style={{ fontSize: ".8rem", marginTop: 8 }}>
          By Jaideep Mahendra · IT support & data analysis
        </p>
      </header>
      <Badge>Working demo · Synthetic sample data</Badge>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <Columns>
        <div>
          <h3>The problem</h3>
          <p>{project.problem}</p>
          <h3 style={{ marginTop: 20 }}>Approach</h3>
          <p>{project.approach}</p>
        </div>
        <div>
          <h3>Try these features</h3>
          <ul>
            {project.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </Columns>
      <TicketDemo />
      <Panel>
        <h2>Scope and limitations</h2>
        <p>{project.limitations}</p>
        <p style={{ marginTop: 12 }}>
          Independent portfolio project with no employer data.
        </p>
      </Panel>
    </Shell>
  );
}
