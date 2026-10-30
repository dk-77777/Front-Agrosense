// The mock dataset has a frozen clock; never compare this historical sample to wall time.
export const DEMO_NOW = "2026-10-19T10:30:05";
export function machineState(machine, now = DEMO_NOW) {
  const candidate =
    machine.lastReadingAt ??
    (machine.updatedAt?.match(/^\d\d:\d\d:\d\d$/)
      ? `2026-10-19T${machine.updatedAt}`
      : null);
  const timestamp =
    candidate &&
    Number.isFinite(Date.parse(candidate)) &&
    Date.parse(candidate) <= Date.parse(now)
      ? candidate
      : null;
  const seconds = timestamp
    ? Math.max(0, (new Date(now) - new Date(timestamp)) / 1000)
    : Infinity;
  const communication = !timestamp
    ? "Sem leituras"
    : seconds > 30
      ? "Sem atualização"
      : "Dados recentes";
  const analysis =
    machine.analysisState ??
    (machine.status === "offline" ? "unavailable" : "available");
  const analysisLabel =
    {
      available: "Disponível",
      pending: "Aguardando análise",
      unavailable: "Análise indisponível",
    }[analysis] ?? "Análise indisponível";
  return {
    timestamp,
    seconds,
    communication,
    recent: communication === "Dados recentes",
    analysis,
    analysisLabel,
    condition:
      analysis === "available"
        ? (machine.condition ??
          (machine.status === "warning" ? "warning" : "normal"))
        : "unknown",
  };
}
