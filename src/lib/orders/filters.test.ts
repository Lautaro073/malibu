import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDefaultAdminOrderStatusFilter } from "./filters";

describe("getDefaultAdminOrderStatusFilter", () => {
  it("shows pending orders by default when any order needs review", () => {
    assert.equal(
      getDefaultAdminOrderStatusFilter({ pending: 1, confirmed: 3, cancelled: 2 }),
      "pending_confirmation"
    );
  });

  it("shows confirmed orders by default when there are no pending orders", () => {
    assert.equal(
      getDefaultAdminOrderStatusFilter({ pending: 0, confirmed: 3, cancelled: 2 }),
      "confirmed"
    );
  });
});
