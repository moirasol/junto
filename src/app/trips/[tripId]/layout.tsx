"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, ListChecks, Wallet, HandCoins } from "lucide-react";
import { useTrip } from "@/lib/hooks";
import { AvatarStack } from "@/components/ui/Primitives";
import clsx from "clsx";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  planning: "Organizando",
  ready: "Listo para viajar",
  in_progress: "En viaje",
  finished: "Terminado",
  closed: "Cerrado",
  deleted: "Borrado",
};

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm",
        active ? "bg-brand-600 text-white" : "text-neutral-500 hover:bg-brand-50 hover:text-brand-700"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tripId: string };
}) {
  const trip = useTrip(params.tripId);
  const pathname = usePathname();

  if (!trip) {
    return (
      <main className="space-y-4">
        <Link href="/trips" className="text-sm text-brand-700 hover:underline">
          ← Volver a tus viajes
        </Link>
        <p className="text-neutral-600">No encontramos ese viaje.</p>
      </main>
    );
  }

  const base = `/trips/${trip.id}`;
  const tabs = [
    { href: base, label: "Resumen", icon: Home },
    { href: `${base}/decisions`, label: "Decisiones", icon: ListChecks },
    { href: `${base}/expenses`, label: "Gastos", icon: Wallet },
    { href: `${base}/settlement`, label: "Liquidación", icon: HandCoins },
  ];

  return (
    <main className="space-y-4">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft size={16} /> Tus viajes
      </Link>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
              {trip.destination}
            </p>
            <h1 className="text-xl font-bold">{trip.name}</h1>
          </div>
          <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">
            {STATUS_LABEL[trip.status]}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {trip.participants.length === 0 ? (
            <p className="text-sm text-brand-100">Todavía no invitaste a nadie.</p>
          ) : (
            <AvatarStack names={trip.participants.map((p) => p.name)} />
          )}
        </div>
      </div>

      <nav className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
      </nav>

      {children}
    </main>
  );
}
