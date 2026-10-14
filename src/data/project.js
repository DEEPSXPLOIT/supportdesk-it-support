export const project = {
  id: 1,
  slug: "support-desk",
  title: "SupportDesk \u2014 Ticket & SLA Monitor",
  subtitle: "IT support operations",
  description:
    "Create and triage support tickets, track SLA risk by priority, resolve incidents, and export a queue report. Built with synthetic incidents and browser-local storage.",
  category: "IT Tech Support",
  tech: ["React", "SLA Rules", "Local Storage", "CSV Export"],
  problem:
    "A support team needs a clear view of urgent incidents and response commitments.",
  approach:
    "A priority-based SLA rules engine calculates breaches from a fixed scenario age. Queue filters and persistent status changes support triage.",
  features: [
    "Create incidents with a category and priority",
    "Filter by status and search incident descriptions",
    "Resolve tickets and inspect SLA risk",
    "Export the current queue to CSV",
  ],
  limitations:
    "A browser-local simulation with fixed ticket ages; no live clock, shared ticket system, authentication, or email notifications.",
  image: "/projects/support-desk.svg",
  link: "/projects/support-desk",
  year: "Portfolio demo",
  github: null,
};
