export function centsToCurrency(cents: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function pesosToCents(value: number) {
  return Math.round(value * 100);
}
