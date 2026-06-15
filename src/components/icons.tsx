export function WalkIcon({
  size = 13,
  color = "#8B949E",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="5" r="1" />
      <path d="M9 20l1-6 2 2 1-5" />
      <path d="M7 10.5c1.5-1 3-1.5 5-1.5" />
      <path d="M14 7l1.5 3-3 2" />
      <path d="M10 14l-2 6" />
      <path d="M14 9l2 11" />
    </svg>
  );
}

export function carparkTypeLabel(
  type: "garage" | "surface" | "unknown"
): string {
  if (type === "garage") return "Multi-level Garage";
  if (type === "surface") return "Surface Lot";
  return "Parking Lot";
}
