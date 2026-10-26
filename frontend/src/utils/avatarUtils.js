/**
 * avatarUtils.js
 * ──────────────────────────────────────────────────────────────────────────
 * Centralised, deterministic avatar-colour resolver.
 *
 * Strategy: derive a stable index from the user's **name** (not ID), so the
 * same person always gets the same colour regardless of which component is
 * rendering or whether a full `users` list is available.
 *
 * The palette is intentionally limited to 8 vivid-yet-accessible pastel tones
 * that match the existing CSS `tone-*` classes throughout the design system.
 */

const AVATAR_TONES = [
  'blue',
  'emerald',
  'violet',
  'amber',
  'rose',
  'teal',
  'indigo',
  'orange',
];

/**
 * Returns a deterministic tone key for a given user name string.
 * Falls back to 'neutral' when name is falsy.
 *
 * @param {string} name  - User display name (e.g. "John Smith")
 * @returns {string}     - One of the AVATAR_TONES keys or 'neutral'
 */
export function getAvatarTone(name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return 'neutral';
  }
  // Stable hash: sum of char codes of the trimmed, lower-cased name.
  const normalized = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash += normalized.charCodeAt(i);
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/**
 * Returns the two-letter uppercase initials for a display name.
 *
 * @param {string} name - User display name
 * @returns {string}    - Up to 2 uppercase initials, e.g. "JS" for "John Smith"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
