import test from "node:test";
import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
test("Documented sample results match independently specified expectations", () => {
  const report = analyze(example.records, example.settings, config.asOf);
  for (const [label, value] of [
    ["Attributed sales", "2000.00"],
    ["Rewards outstanding", "200.00"],
    ["Referred leads", 1],
  ])
    assert.equal(
      report.metrics.find((m) => m.label === label).value,
      value,
      label,
    );
});
test("Business edge cases", () => {
  (function edge(records, s, analyze, validate) {
    assert.throws(
      () =>
        validate(
          {
            ...example,
            records: [records[0], { ...records[0], id: "duplicate" }],
          },
          config,
        ),
      /unique/,
    );
    assert.equal(
      analyze([{ ...records[0], status: "refunded" }], s).metrics[0].value,
      "0.00",
    );
  })(example.records, example.settings, analyze, validateState);
});
