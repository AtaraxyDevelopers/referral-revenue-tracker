import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
// Record the partner reward as paid after confirming the payment.
// This changes a copy of fictional data; no files or external services are changed.
const workspace = structuredClone(example);
Object.assign(workspace.records[0], { rewardPaid: true });
const valid = validateState(workspace, config);
const report = analyze(valid.records, valid.settings, config.asOf);
const actual = report.metrics.find(
  (metric) => metric.label === "Rewards outstanding",
).value;
assert.equal(actual, "0.00");
console.log("Rewards outstanding: " + actual);
