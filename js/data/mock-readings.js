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
