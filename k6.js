



import http from 'k6/http';
import { check } from 'k6';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjlkOGM0NWNhYWQ2ZWI0YzE2Y2ZmNiIsImlhdCI6MTc5MDY2MjExOSwiZXhwIjoxNzkwNzQ4NTE5fQ.CBx6KVJfeMZcabDomjwlLPBGjoiPOgYcnaxeSktrMIw';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const url = 'http://localhost:3000/api/transaction';

  const payload = JSON.stringify({
    fromAccount: '6a2a594cf2a4913b1f1d6dc1',
    toAccount: '6a29d5d95caad6eb4c16cfca',
    amount: 100,

    // Different key for every request
    idempotencyKey: `test-lock-${__VU}-${__ITER}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${token}`,
    },
  };

  const res = http.post(url, payload, params);

  console.log(
    `VU=${__VU} ITER=${__ITER} Status=${res.status} Body=${res.body}`
  );

  check(res, {
    'status is expected': (r) =>
      r.status === 201 ||
      r.status === 409 ||
      r.status === 400,
  });
}