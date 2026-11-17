import test from 'node:test';
import assert from 'node:assert/strict';
import { consultingHourTotals, estimatedHours } from './consulting';

test('November 8 Wheeler visit from 5:30 AM to 8:00 AM contributes 2.5 recorded hours', () => {
  assert.equal(consultingHourTotals([], [{ occurred_on: '2026-11-08', data: { arrival: '05:30', departure: '08:00' } }]).onSite, 2.5);
});
test('Approximately 4.5 phone hours stay estimated and never increase recorded totals', () => {
  const phone = { data: { activityType: 'Phone Call', timeStatus: 'Estimated', estimatedHours: 4.5 } };
  assert.equal(estimatedHours(phone), 4.5);
  assert.equal(consultingHourTotals([phone], []).total, 0);
});