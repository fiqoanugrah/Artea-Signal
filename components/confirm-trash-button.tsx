"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type ConfirmTrashButtonProps = {
  actionText?: string;
  label?: string;
  message?: string;
  variant?: "icon" | "text";
};

export function ConfirmTrashButton({
  actionText = "Move to trash",
  label = "Move to trash",
  message = "Are you sure mau pindahin report ini ke trash? Nanti masih bisa undo/restore dari halaman Trash.",
  variant = "icon"
}: ConfirmTrashButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={label}
      className={variant === "icon" ? "icon-button danger-icon" : "button button-danger"}
      disabled={pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      title={label}
      type="submit"
    >
      {pending ? <LoaderCircle className="loading-spinner" size={16} /> : <Trash2 size={16} />}
      {variant === "text" ? (pending ? "Working..." : actionText) : null}
    </button>
  );
}
