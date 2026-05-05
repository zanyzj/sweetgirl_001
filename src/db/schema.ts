import { pgTable, text, varchar, integer, timestamp, jsonb, date, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  coverUrl: text('cover_url').notNull(),
  description: text('description').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  initialAffection: integer('initial_affection').default(10),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userCharacterRelations = pgTable('user_character_relations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  characterId: text('character_id').notNull(),
  affection: integer('affection').default(10),
  stage: varchar('stage', { length: 20 }).default('stranger'),
  lastChatAt: timestamp('last_chat_at'),
  consecutiveDays: integer('consecutive_days').default(0),
  todayAddition: integer('today_addition').default(0),
  todayDeduction: integer('today_deduction').default(0),
  countersResetDate: date('counters_reset_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userCharacterIdx: uniqueIndex('user_character_idx').on(table.userId, table.characterId),
}));

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  characterId: text('character_id').notNull(),
  relationId: text('relation_id').notNull(),
  role: varchar('role', { length: 10 }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isProactive: boolean('is_proactive').default(false),
  affectionDelta: integer('affection_delta').default(0),
  affectionAfter: integer('affection_after'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userCharacterCreatedIdx: index('user_character_created_idx').on(table.userId, table.characterId, table.createdAt),
}));

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  nickname: varchar('nickname', { length: 50 }),
  birthday: varchar('birthday', { length: 20 }),
  hobbies: jsonb('hobbies').default('[]'),
  favoriteFood: text('favorite_food'),
  job: varchar('job', { length: 100 }),
  otherInfo: jsonb('other_info').default('{}'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const charactersRelations = relations(characters, ({ many }) => ({
  userCharacterRelations: many(userCharacterRelations),
  messages: many(messages),
}));

export const userCharacterRelationsRelations = relations(userCharacterRelations, ({ one }) => ({
  character: one(characters, { fields: [userCharacterRelations.characterId], references: [characters.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  character: one(characters, { fields: [messages.characterId], references: [characters.id] }),
  relation: one(userCharacterRelations, { fields: [messages.relationId], references: [userCharacterRelations.id] }),
}));

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type UserCharacterRelation = typeof userCharacterRelations.$inferSelect;
export type NewUserCharacterRelation = typeof userCharacterRelations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export * from './auth-schema';
