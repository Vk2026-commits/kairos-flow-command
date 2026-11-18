import test from 'node:test';
import assert from 'node:assert/strict';
import { consultingHourTotals, recordedHours } from './consulting';

const sessions = [
  { occurred_on: '2026-11-16', data: { startTime: '10:30', endTime: '11:45', timeStatus: 'Recorded' } },
  { occurred_on: '2026-11-16', data: { startTime: '15:00', endTime: '17:30', timeStatus: 'Recorded' } },
];

test('November 16 North Campus morning camera review records 1.25 hours', () => {
  assert.equal(recordedHours(sessions[0]), 1.25);
});

test('November 16 North Campus afternoon camera review and reports record 2.5 hours', () => {
  assert.equal(recordedHours(sessions[1]), 2.5);
});

test('November 16 North Campus sessions count 3.75 on-site hours once across activity and visit logs', () => {
  const visits = sessions.map(({ occurred_on, data }) => ({
    occurred_on,
    data: { arrival: data.startTime, departure: data.endTime },
  }));
  assert.deepEqual(consultingHourTotals(sessions, visits), { onSite: 3.75, offSite: 0, total: 3.75 });
});