import React from "react";
import { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statCardVariants = cva("flex-shrink-0 bg-primary-100 rounded-md p-3", {
  variants: {
    variant: {
      primary: "bg-primary-100 text-primary-600",
      success: "bg-green-100 text-green-600",
      warning: "bg-yellow-100 text-yellow-600",
      info: "bg-indigo-100 text-indigo-600",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statCardVariants> {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "info";
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  variant,
  className,
  ...props 
}) => {
  return (
    <div className="card-modern hover-lift animate-scale-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-3">{value}</p>
          {/*change && (
            <div className="flex items-center">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                change.type === 'increase' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              )}>
                {change.type === 'increase' ? '↗' : '↘'} {change.value}
              </span>
              <span className="text-sm text-gray-500 ml-2">desde ayer</span>
            </div>
          )*/}
        </div>
        {/*<div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-blue-600",
          color === 'green' && "bg-gradient-to-br from-green-500 to-green-600",
          color === 'yellow' && "bg-gradient-to-br from-yellow-500 to-yellow-600",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-purple-600",
          color === 'red' && "bg-gradient-to-br from-red-500 to-red-600"
        )}>
          <Icon className="w-7 h-7 text-white" />
        </div>*/}
      </div>
    </div>
  );
};

export default StatCard;