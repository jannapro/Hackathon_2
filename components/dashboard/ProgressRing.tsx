"use client";

interface ProgressRingProps {
  label: string;
  value: number;
  total: number;
  color: string;
  bgColor: string;
}

export function ProgressRing({ label, value, total, color, bgColor }: ProgressRingProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}/{total}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
