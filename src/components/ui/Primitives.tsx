import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm", className)}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" &&
          "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
        variant === "ghost" && "text-brand-700 hover:bg-brand-50",
        className
      )}
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={clsx("mb-1 block text-sm font-medium text-neutral-700", className)} {...props} />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "warning" | "danger" | "success";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
        tone === "brand" && "bg-brand-100 text-brand-800",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "danger" && "bg-rose-100 text-rose-800",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
      <p className="font-medium text-neutral-700">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
