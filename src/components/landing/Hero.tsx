import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart,
  Users,
  Briefcase,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Settings,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="bg-slate-50 dark:bg-zinc-900 overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
              Gerencie seus projetos com <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none text-[#13ec5b]">
                Interface Moderna
              </span>
            </h1>
          </>
        }
      >
        {/* Browser Frame UI */}
        <div className="w-full h-full rounded-xl border border-slate-200 shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Top Bar with Traffic Lights */}
          <div className="h-10 border-b border-slate-100 bg-slate-50/50 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>

          {/* Dashboard Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (Hidden on mobile) */}
            <div className="hidden md:flex w-64 border-r border-slate-100 bg-white flex-col p-4 gap-2">
              <div className="flex items-center gap-2 px-2 mb-6">
                <div className="w-8 h-8 rounded bg-[#13ec5b] flex items-center justify-center text-white font-bold">
                  R
                </div>
                <span className="font-bold text-slate-900">Ripple</span>
              </div>

              <SidebarItem
                icon={<LayoutDashboard size={20} />}
                label="Dashboard"
                active
              />
              <SidebarItem icon={<FolderKanban size={20} />} label="Projects" />
              <SidebarItem icon={<CheckSquare size={20} />} label="Tasks" />
              <SidebarItem
                icon={<MessageSquare size={20} />}
                label="Messages"
              />
              <SidebarItem icon={<Settings size={20} />} label="Settings" />
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <Button className="bg-[#13ec5b] hover:bg-[#0da540] text-white">
                  <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard
                  icon={<Briefcase className="text-blue-500" />}
                  label="Total Projects"
                  value="12"
                />
                <StatCard
                  icon={<CheckCircle2 className="text-[#13ec5b]" />}
                  label="Active Tasks"
                  value="34"
                />
                <StatCard
                  icon={<Users className="text-purple-500" />}
                  label="Team Members"
                  value="8"
                />
              </div>

              {/* Data List Section */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-medium text-slate-500 text-sm">
                  Recent Activity
                </div>
                <div className="divide-y divide-slate-100">
                  <ListItem label="Project Alpha" status="In Progress" />
                  <ListItem label="Marketing Campaign" status="Review" />
                  <ListItem label="Website Redesign" status="Planning" />
                  <ListItem label="Mobile App" status="Development" />
                  <ListItem label="Client Meeting" status="Done" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
        active
          ? "bg-[#13ec5b]/10 text-[#13ec5b]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ListItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center">
          {/* Checkbox Placeholder */}
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#13ec5b]/20 text-green-700">
        {status}
      </span>
    </div>
  );
}
