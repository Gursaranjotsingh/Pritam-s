import type { SpiceLevel as SpiceLevelType } from "@/lib/types";

const LEVELS: Record<string, { count: number; label: string }> = {
  mild: { count: 1, label: "Mild" },
  medium: { count: 2, label: "Medium" },
  hot: { count: 3, label: "Hot" },
  extra_hot: { count: 4, label: "Extra Hot" },
};

export default function SpiceLevel({ level, size = "sm" }: { level: SpiceLevelType | string; size?: "sm" | "md" }) {
  const info = LEVELS[level] ?? LEVELS.medium;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize}`} title={`Spice level: ${info.label}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className={i < info.count ? "opacity-100" : "opacity-20"} aria-hidden>
          🌶️
        </span>
      ))}
      <span className="ml-1 font-medium text-earth-600">{info.label}</span>
    </span>
  );
}
