import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconVariant?: "primary" | "success" | "warning" | "info";
  valueColor?: string;
}

const iconVariantClasses = {
  primary: "bg-gradient-to-br from-blue-500 to-cyan-400",
  success: "bg-gradient-to-br from-green-500 to-emerald-400",
  warning: "bg-gradient-to-br from-orange-500 to-yellow-400",
  info: "bg-gradient-to-br from-blue-600 to-blue-400",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconVariant = "primary",
  valueColor = "text-primary",
}: StatsCardProps) {
  return (
    <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-2xl">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-400">
          {title}
        </p>
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      </div>
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconVariantClasses[iconVariant]}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
