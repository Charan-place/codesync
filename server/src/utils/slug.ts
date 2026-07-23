import { v4 as uuidv4 } from 'uuid';

// Short, URL-friendly room codes, e.g. "a1b2c3d4"
export function generateSlug(): string {
  return uuidv4().split('-')[0];
}

const PARTICIPANT_COLORS = [
  '#F97316', '#22C55E', '#3B82F6', '#EC4899', '#A855F7',
  '#EAB308', '#14B8A6', '#EF4444', '#6366F1', '#84CC16',
];

export function colorForIndex(i: number): string {
  return PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
}
