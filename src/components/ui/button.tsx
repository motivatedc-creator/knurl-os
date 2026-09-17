import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,transform,opacity] duration-150 ease-[var(--ease-out-knurl)] select-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide",
  {
    variants: {
      variant: {
        primary: "bg-chalk text-mill hover:bg-chalk/90",
        oxide: "bg-oxide text-chalk hover:bg-oxide/90",
        ghost: "bg-transparent text-chalk hover:bg-elevated",
        outline: "border border-hairline-strong bg-transparent text-chalk hover:bg-elevated",
        steel: "bg-elevated text-chalk hover:bg-hairline-strong",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-xs",
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-14 rounded-md px-5 text-base",
        xl: "h-16 rounded-lg px-6 text-base",
        icon: "size-11 rounded-md",
        hit: "size-12 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

