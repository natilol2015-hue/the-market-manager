import { getSession } from "@/lib/dal";
import { Nav } from "@/app/(app)/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSession();

  return (
    <div className="flex flex-1 flex-col">
      <Nav role={profile.role} fullName={profile.full_name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
