import { FormHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface CyberFormProps extends FormHTMLAttributes<HTMLFormElement> {
  headerBadge?: string;
}

export const CyberForm = forwardRef<HTMLFormElement, CyberFormProps>(
  ({ children, className, headerBadge, ...props }, ref) => {
    return (
      <form ref={ref} className={cn("space-y-4 relative", className)} {...props}>
        {headerBadge && (
          <div className="flex items-center justify-between border-b border-[#222222] pb-2 mb-4 font-mono text-[10px] text-[#777] uppercase tracking-widest">
            <span>{headerBadge}</span>
            <span className="flex items-center gap-1.5 text-tertiary-container">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
              ONLINE
            </span>
          </div>
        )}
        {children}
      </form>
    );
  }
);

CyberForm.displayName = "CyberForm";

export default CyberForm;
