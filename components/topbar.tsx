import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut, Plus, RadioTower, Shield, Trash2, UserCircle } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export async function Topbar() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Image alt="Artea AI logo" height={34} priority src="/artea-logo.png" width={34} />
        </span>
        <span>
          <span className="brand-title">Artea Signal</span>
          <span className="brand-subtitle">Product signals for Artea AI</span>
        </span>
      </Link>
      <nav className="nav-actions" aria-label="Main navigation">
        <Link className="button button-secondary" href="/">
          <RadioTower size={16} />
          Board
        </Link>
        <Link className="button button-secondary" href="/submit">
          <Plus size={16} />
          Submit
        </Link>
        {user ? (
          <>
            {profile?.role === "admin" ? (
              <>
                <Link className="button button-secondary" href="/admin/users">
                  <Shield size={16} />
                  Admin
                </Link>
                <Link className="button button-secondary" href="/admin/trash">
                  <Trash2 size={16} />
                  Trash
                </Link>
              </>
            ) : null}
            <Link className="button button-secondary" href="/profile">
              <UserCircle size={16} />
              Profile
            </Link>
            <form action={logout} className="inline-form">
              <span className="filter-pill">{user.email}</span>
              <PendingSubmitButton pendingText="Logging out...">
                <LogOut size={16} />
                Logout
              </PendingSubmitButton>
            </form>
          </>
        ) : (
          <Link className="button button-primary" href="/login">
            <LogIn size={16} />
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
