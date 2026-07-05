// TODO (spec §8): precisión de redondeo sin definir (peso entero vs. decimales).
// Se mantiene precisión completa en los cálculos y se muestran hasta 2 decimales.
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function dividePerParticipant(amount: number, participantCount: number): number {
  if (participantCount <= 0) return 0;
  return amount / participantCount;
}
