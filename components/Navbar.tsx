"use client";

import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <span className="font-bold text-lg text-white">Sound Meter</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
