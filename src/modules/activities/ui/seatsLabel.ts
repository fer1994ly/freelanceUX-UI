export function seatsLabel(free: number): string {
  if (free <= 0) return 'Cupo completo · lista de espera disponible'
  return free === 1 ? '1 lugar disponible' : `${free} lugares disponibles`
}
