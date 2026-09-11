// All prices are stored/passed around in paise (integer) to avoid float rounding bugs.
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}
