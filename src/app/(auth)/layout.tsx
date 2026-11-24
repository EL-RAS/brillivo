import Image from "next/image";
import Link from "next/link";

const HIGHLIGHTS = [
  "Hand-finished 925 sterling silver, made to last",
  "Complimentary shipping and 30-day returns",
  "Members-only previews of new collections",
] as const;

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Brillivo home"
      className={`flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 ${className}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={48}
        height={48}
        priority
        className="h-11 w-11 object-contain"
      />
      <span className="text-caption font-medium uppercase tracking-[0.45em] text-light-100">
        Brillivo
      </span>
    </Link>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-100 lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-dark-900 p-10 text-light-100 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-(--color-silver-500)/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-(--color-silver-400)/10 blur-3xl"
        />

        <Logo className="relative" />

        <div className="relative max-w-md">
          <p className="text-footnote uppercase tracking-[0.3em] text-silver-400">
            Fine silver jewelry
          </p>
          <h2 className="mt-5 text-heading-2 text-light-100">
            Crafted in silver,
            <br />
            made for every day.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-body text-light-400">
                <span aria-hidden="true" className="mt-3 h-px w-5 shrink-0 bg-silver-400" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-footnote text-light-400">
          © {new Date().getFullYear()} Brillivo. All rights reserved.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col lg:min-h-0">
        <header className="border-b border-silver-200 bg-light-100 px-4 py-5 sm:px-6 lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-center">
            <Link
              href="/"
              aria-label="Brillivo home"
              className="flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-silver-500] focus-visible:ring-offset-2"
            >
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                priority
                className="h-9 w-9 object-contain"
              />
              <span className="text-caption font-medium uppercase tracking-[0.45em] text-dark-900">
                Brillivo
              </span>
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
