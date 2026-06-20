const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

module.exports = async function handler(req, res) {
  const { app } = req.query;
  const logKey = `log:${app}`;

  const entries = await redis.lrange(logKey, 0, -1);
  const sessions = entries.map(e => typeof e === 'string' ? JSON.parse(e) : e);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(s => s.start >= todayStart.getTime());
  const totalMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60000);

  res.status(200).json({
    app,
    todayUsageMinutes: totalMinutes,
    sessionCountToday: todaySessions.length
  });
};
