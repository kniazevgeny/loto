export type GameSource = { kind: "printed" } | { kind: "local"; projectId: string } | { kind: "missing" };

export function gameSource(search: string): GameSource {
  const query = new URLSearchParams(search);
  const sets = query.getAll("set");
  const projects = query.getAll("project");
  if (sets.length <= 1 && (!sets.length || sets[0] === "default") && !projects.length) return { kind: "printed" };
  if (sets.length === 1 && sets[0] === "local" && projects.length === 1 && projects[0]) {
    return { kind: "local", projectId: projects[0] };
  }
  return { kind: "missing" };
}

export function localGameHref(baseUrl: string, projectId: string) {
  return `${baseUrl}game/?${new URLSearchParams({ set: "local", project: projectId })}`;
}