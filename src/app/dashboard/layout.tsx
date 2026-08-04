import { getUser } from "@/lib/dal";
import { DashboardNav } from "./_components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <DashboardNav
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null
        }
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
