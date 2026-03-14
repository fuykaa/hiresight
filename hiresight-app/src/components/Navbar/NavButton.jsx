import React from "react";
import Link from "next/link";
export default function NavButton({ text, href, active }) {
  return (
    <Link href={href}>
      <div
        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
          active
            ? "bg-base-300 text-primary shadow-sm"
            : "text-base-content/60 hover:text-base-content hover:bg-base-content/5"
        }`}
      >
        {text}
      </div>
    </Link>
  );
}
