// Shared project color palette. Colors are assigned by a project's position in the
// projects list, so projects never share a color until the palette is exhausted,
// and the same project keeps the same color across Projects and Tasks pages.
export const PROJECT_THEMES = [
  'blue',
  'emerald',
  'violet',
  'amber',
  'rose',
  'teal',
  'indigo',
  'orange',
];

export function getProjectTheme(projectId, projects = []) {
  const index = projects.findIndex((p) => String(p.id) === String(projectId));
  if (index === -1) return PROJECT_THEMES[0];
  return PROJECT_THEMES[index % PROJECT_THEMES.length];
}

// Same palette is used for team members so a person keeps one color everywhere
// (dashboard avatar stacks, task assignee avatars, ...).
export function getUserTheme(userId, users = []) {
  if (userId === null || userId === undefined || userId === '') return 'neutral';
  const index = users.findIndex((u) => String(u.id) === String(userId));
  if (index !== -1) return PROJECT_THEMES[index % PROJECT_THEMES.length];
  const n = Number(userId);
  const fallback = Number.isFinite(n) ? Math.abs(n) : String(userId).length;
  return PROJECT_THEMES[fallback % PROJECT_THEMES.length];
}