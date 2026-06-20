const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

module.exports = async function handler(req, res) {
  const { app } = req.query;
  const stateKey = `state:${app}`;
  const logKey = `log:${app}`;
  const now = Date.now();

  const current = await redis.get(stateKey);

  if (!current || current.status === 'closed') {
    await redis.set(stateKey, { status: 'open', since: now });
    return res.status(200).json({ app, action: 'opened', time: now });
  } else {
    const duration = now - current.since;
    await redis.set(stateKey, { status: 'closed', since: now });
    await redis.rpush(logKey, JSON.stringify({ start: current.since, end: now, duration }));
    return res.status(200).json({ app, action: 'closed', durationMs: duration });
  }
};
