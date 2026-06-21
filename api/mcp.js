import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const handler = createMcpHandler((server) => {
  server.tool(
    'get_screentime_stats',
    '查询某个App今天的使用时长和次数',
    { app: z.string().describe('App的名字，比如微信、小红书') },
    async ({ app }) => {
      const logKey = `log:${app}`;
      const entries = await redis.lrange(logKey, 0, -1);
      const sessions = entries.map(e => typeof e === 'string' ? JSON.parse(e) : e);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySessions = sessions.filter(s => s.start >= todayStart.getTime());
      const totalMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60000);

      return {
        content: [
          {
            type: 'text',
            text: `${app} 今天使用了 ${totalMinutes} 分钟，共打开 ${todaySessions.length} 次`,
          },
        ],
      };
    }
  );
});

export { handler as GET, handler as POST };
