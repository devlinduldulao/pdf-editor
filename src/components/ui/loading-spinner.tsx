import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "default" | "lg" | "xl";
}

export function LoadingSpinner({ className, size = "default", ...props }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        default: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
        xl: "w-16 h-16 border-4",
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}
