// Data service kept separate so a real API can replace the static demonstration.
export async function getReadings() {
  const response = await fetch("./js/data/readings.json", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar as leituras.");
  const readings = await response.json();
  if (
    !Array.isArray(readings) ||
    readings.some(
      (p) => typeof p.time !== "string" || !Number.isFinite(p.temperature),
    )
  )
    throw new Error("Formato de leitura inválido.");
  return readings;
}

// Explicitly simulated series for the five seeded machines; new registrations
// have no samples. This is a fixture, not a production analysis rule.
export function readingsForMachine(machine, series) {
  if (!/^AG-00[1-5]$/.test(machine.id) || !Number.isFinite(machine.temperature))
    return [];
  return series
    .filter((p) => machine.status !== "offline" || p.time <= "10:18")
    .map((p) => ({
      ...p,
      temperature:
        Math.round((p.temperature - 37 + machine.temperature) * 10) / 10,
    }));
}
