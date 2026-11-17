import test from 'node:test';
import assert from 'node:assert/strict';
import { consultingHourTotals, estimatedHours } from './consulting';

test('November 8 Wheeler visit from 5:30 AM to 8:00 AM contributes 2.5 recorded hours', () => {
  assert.equal(consultingHourTotals([], [{ occurred_on: '2026-11-08', data: { arrival: '05:30', departure: '08:00' } }]).onSite, 2.5);
});
test('November 2-4 evening parking reviews from 6:30 PM to 10:00 PM contribute 3.5 recorded hours each', () => {
  const visits = ['2026-11-02', '2026-11-03', '2026-11-04'].map((occurred_on) => ({
    occurred_on,
    data: { arrival: '18:30', departure: '22:00' },
  }));
  const totals = consultingHourTotals([], visits);
  assert.equal(totals.onSite, 10.5);
  assert.equal(totals.total, 10.5);
});
test('Approximately 4.5 phone hours stay estimated and never increase recorded totals', () => {
  const phone = { data: { activityType: 'Phone Call', timeStatus: 'Estimated', estimatedHours: 4.5 } };
  assert.equal(estimatedHours(phone), 4.5);
  assert.equal(consultingHourTotals([phone], []).total, 0);
});