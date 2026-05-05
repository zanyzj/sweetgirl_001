'use client';

import Link from 'next/link';
import { Character, UserCharacterRelation } from '@/db/schema';
import { getStageName, getStageFromAffection } from '@/lib/constants';
import { useEffect, useState } from 'react';

interface CharacterWithRelation extends Character {
  relation?: UserCharacterRelation;
}

export function CharacterCard({ character, userId }: { character: Character; userId: string }) {
  const [relation, setRelation] = useState<UserCharacterRelation | null>(null);

  useEffect(() => {
    fetch(`/api/relation?userId=${userId}&characterId=${character.id}`)
      .then((res) => res.json())
      .then((data) => setRelation(data));
  }, [userId, character.id]);

  const affection = relation?.affection ?? 10;
  const stage = getStageFromAffection(affection);
  const stageName = getStageName(stage);

  return (
    <Link href={`/chat/${character.id}`}>
      <div className="bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer group">
        <div className="aspect-square bg-zinc-800 relative">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {character.id === 'sister' && '🧡'}
              {character.id === 'cute' && '🍑'}
              {character.id === 'cool' && '❄️'}
              {character.id === 'teacher' && '📚'}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">{character.name}</h2>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                stage === 'lover'
                  ? 'bg-rose-400 text-white'
                  : 'bg-amber-400 text-zinc-900'
              }`}
            >
              {stageName}
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2">{character.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stage === 'lover' ? 'bg-rose-400' : 'bg-amber-400'
                }`}
                style={{ width: `${affection}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{affection}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
