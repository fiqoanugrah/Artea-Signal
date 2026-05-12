"use client";

import { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  pendingText?: string;
};

export function PendingSubmitButton({
  children,
  className = "button button-primary",
  pendingText = "Working..."
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  const buttonClassName = pending ? `${className} is-loading` : className;

  return (
    <button className={buttonClassName} disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="loading-spinner" size={16} />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
