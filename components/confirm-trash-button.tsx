"use client";

import { Trash2 } from "lucide-react";

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
  return (
    <button
      aria-label={label}
      className={variant === "icon" ? "icon-button danger-icon" : "button button-danger"}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      title={label}
      type="submit"
    >
      <Trash2 size={16} />
      {variant === "text" ? actionText : null}
    </button>
  );
}
