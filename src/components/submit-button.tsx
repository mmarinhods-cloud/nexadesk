"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText, disabled = false, className = "button-primary auth-submit" }: {
  children: React.ReactNode;
  pendingText: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={disabled || pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}
