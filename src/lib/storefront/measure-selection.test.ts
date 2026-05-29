import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toggleMeasureSelection } from "./measure-selection";

describe("toggleMeasureSelection", () => {
  it("selects a measure that is not selected", () => {
    assert.deepEqual(toggleMeasureSelection(["M"], "L"), ["M", "L"]);
  });

  it("deselects a measure that is already selected", () => {
    assert.deepEqual(toggleMeasureSelection(["M", "L"], "M"), ["L"]);
  });
});
