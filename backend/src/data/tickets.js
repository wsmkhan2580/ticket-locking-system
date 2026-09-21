/**
 * Seed ticket data.
 *
 * This is deliberately a plain in-memory array, not a database model. The
 * feature spec is about the locking mechanism, not ticket CRUD — so tickets
 * are static seed data shared by every connected client. Lock state (who
 * has which ticket open) is tracked separately in lockManager.js.
 */

const tickets = [
  {
    id: "TCK-1001",
    customerName: "Amelia Chen",
    subject: "Unable to reset password after 2FA change",
    priority: "high",
    status: "open",
  },
  {
    id: "TCK-1002",
    customerName: "Marcus Reed",
    subject: "Invoice #4471 shows incorrect tax amount",
    priority: "medium",
    status: "open",
  },
  {
    id: "TCK-1003",
    customerName: "Priya Nair",
    subject: "Feature request: bulk export to CSV",
    priority: "low",
    status: "open",
  },
  {
    id: "TCK-1004",
    customerName: "Diego Alvarez",
    subject: "App crashes on upload of files > 20MB",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "TCK-1005",
    customerName: "Sophie Laurent",
    subject: "Billing plan downgrade not reflected in dashboard",
    priority: "medium",
    status: "open",
  },
  {
    id: "TCK-1006",
    customerName: "Kwame Boateng",
    subject: "SSO login redirect loop on Safari",
    priority: "high",
    status: "open",
  },
  {
    id: "TCK-1007",
    customerName: "Yuki Tanaka",
    subject: "Request for API rate limit increase",
    priority: "low",
    status: "in_progress",
  },
  {
    id: "TCK-1008",
    customerName: "Olivia Brooks",
    subject: "Notification emails arriving with broken layout",
    priority: "medium",
    status: "open",
  },
];

module.exports = tickets;
