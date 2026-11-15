import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "referral-revenue-tracker",
  title: "Referral Revenue Tracker",
  description:
    "Connect referral codes with verified sales and outstanding partner rewards.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Rewards accrue only for paid orders and are removed for refunds. Order references must be unique. Links add a ref parameter; your website must capture it and import or enter the resulting orders.",
  port: 4418,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Customer / business name",
      type: "text",
    },
    {
      key: "partner",
      label: "Referral partner",
      type: "text",
    },
    {
      key: "code",
      label: "Referral code",
      type: "text",
    },
    {
      key: "orderId",
      label: "Unique order / lead reference",
      type: "text",
    },
    {
      key: "amount",
      label: "Amount",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "rewardRate",
      label: "Reward rate (%)",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "status",
      label: "Outcome",
      type: "select",
      options: ["lead", "paid", "refunded"],
    },
    {
      key: "rewardPaid",
      label: "Partner reward paid",
      type: "boolean",
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "landingUrl",
      label: "Your referral landing page",
      type: "url",
    },
  ],
  actions: [
    {
      label: "Record sale",
      patch: {
        status: "paid",
      },
      when: {
        status: ["lead"],
      },
    },
    {
      label: "Record reward paid",
      patch: {
        rewardPaid: true,
      },
      when: {
        status: ["paid"],
        rewardPaid: [false],
      },
    },
  ],
  document: false,
};
config.validate = function validate(records) {
  const ids = new Set();
  for (const r of records) {
    if (ids.has(r.orderId)) throw new Error("Order references must be unique");
    ids.add(r.orderId);
    if (r.rewardPaid && r.status === "lead")
      throw new Error("A lead cannot have a paid reward");
  }
};
export const example = {
  schemaVersion: 1,
  project: "referral-revenue-tracker",
  settings: {
    currency: "USD",
    landingUrl: "https://example.com/contact",
  },
  records: [
    {
      id: "referral-1",
      name: "Maple Studio",
      partner: "Amina Partners",
      code: "AMINA",
      orderId: "order-100",
      amount: 2000,
      rewardRate: 10,
      status: "paid",
      rewardPaid: false,
    },
    {
      id: "referral-2",
      name: "River Foods",
      partner: "Bilal Partners",
      code: "BILAL",
      orderId: "lead-200",
      amount: 1000,
      rewardRate: 5,
      status: "lead",
      rewardPaid: false,
    },
  ],
};
export function analyze(records, s) {
  const paid = records.filter((r) => r.status === "paid");
  return {
    metrics: [
      metric(
        "Attributed sales",
        money(sum(paid.map((r) => r.amount))),
        s.currency,
      ),
      metric(
        "Rewards outstanding",
        money(
          sum(
            paid
              .filter((r) => !r.rewardPaid)
              .map((r) => round((r.amount * r.rewardRate) / 100)),
          ),
        ),
        s.currency,
      ),
      metric(
        "Referred leads",
        records.filter((r) => r.status === "lead").length,
      ),
    ],
    notices: records
      .filter((r) => r.status === "refunded" && r.rewardPaid)
      .map((r) =>
        notice(
          r.id,
          `${r.partner}: review previously paid reward after refund.`,
          "warning",
        ),
      ),
    columns: ["Customer", "Partner", "Outcome", "Reward", "Referral link"],
    rows: records.map((r) => {
      const url = new URL(s.landingUrl);
      url.searchParams.set("ref", r.code);
      return {
        id: r.id,
        Customer: r.name,
        Partner: r.partner,
        Outcome: r.status,
        Reward: money(
          r.status === "paid" ? round((r.amount * r.rewardRate) / 100) : 0,
        ),
        "Referral link": url.href,
      };
    }),
  };
}
