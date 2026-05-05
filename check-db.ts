import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './src/db';
import { characters } from './src/db/schema';

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
  
  try {
    const chars = await db.select().from(characters);
    console.log('\n=== 数据库中的角色 ===');
    console.log('角色总数:', chars.length);
    chars.forEach((c, index) => {
      console.log(`\n${index + 1}. ${c.name}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   描述: ${c.description}`);
      console.log(`   Avatar: ${c.avatarUrl?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('数据库查询失败:', error);
  }
}

main();
