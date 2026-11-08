import test from "node:test";
import assert from "node:assert/strict";
import { consultingRole } from "./consulting-access";

test("Lighthouse client admin can fully edit consulting records within their site", () => {
  assert.equal(consultingRole("contributor", "client_admin"), "admin");
});
test("Wheeler read-only membership remains read-only", () => {
  assert.equal(consultingRole("viewer", "client_viewer"), "viewer");
});