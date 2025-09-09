"use client";
import { Plus, Users, Mail, BarChart3, FileText } from "lucide-react";

// In a real app, this data would be fetched from your API
const dashboardStats = {
  totalContacts: 152,
  campaignsSent: 12,
  emailsSent: 430,
  replyRate: "7.2%", // This would be calculated in your backend
};

const recentActivity = [
  {
    id: 1,
    type: "campaign",
    description: "Sent 'Java Backend Roles - Batch 2' to 10 contacts",
    time: "2h ago",
  },
  {
    id: 2,
    type: "template",
    description: "Created new template 'Next.js Follow-Up'",
    time: "1d ago",
  },
  {
    id: 3,
    type: "contacts",
    description: "Imported 45 contacts from 'FAANG_Recruiters.csv'",
    time: "1d ago",
  },
  {
    id: 4,
    type: "campaign",
    description: "Sent 'Java Backend Roles - Batch 1' to 20 contacts",
    time: "3d ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex-auto">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome back, Vijay!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Here is a snapshot of your job outreach progress.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              <span>Create New Campaign</span>
            </button>
          </div>
        </div>

        {/* Stat Cards Section */}
        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            title="Total Contacts"
            value={dashboardStats.totalContacts}
          />
          <StatCard
            icon={Mail}
            title="Campaigns Sent"
            value={dashboardStats.campaignsSent}
          />
          <StatCard
            icon={FileText}
            title="Total Emails Sent"
            value={dashboardStats.emailsSent}
          />
          <StatCard
            icon={BarChart3}
            title="Reply Rate"
            value={dashboardStats.replyRate}
            isPercentage={true}
          />
        </div>

        {/* Recent Activity Section */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Recent Activity
          </h2>
          <div className="overflow-hidden shadow-lg bg-white/70 backdrop-blur-lg rounded-2xl ring-1 ring-black ring-opacity-5">
            <ul role="list" className="divide-y divide-slate-200/50">
              {recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors gap-x-6 hover:bg-black/5"
                >
                  <div className="flex items-center gap-x-4">
                    <div className="flex-shrink-0">
                      {/* Icon based on activity type */}
                      {activity.type === "campaign" && (
                        <Mail className="w-6 h-6 text-indigo-500" />
                      )}
                      {activity.type === "template" && (
                        <FileText className="w-6 h-6 text-green-500" />
                      )}
                      {activity.type === "contacts" && (
                        <Users className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-6 text-gray-900">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// A reusable component for the statistics cards
function StatCard({
  icon: Icon,
  title,
  value,
  isPercentage = false,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  isPercentage?: boolean;
}) {
  return (
    <div className="relative p-5 overflow-hidden shadow-lg rounded-2xl bg-white/70 backdrop-blur-lg ring-1 ring-black ring-opacity-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-3 rounded-md bg-indigo-500/20">
            <Icon className="w-6 h-6 text-indigo-600" aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1 w-0 ml-5">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-3xl font-bold tracking-tight text-gray-900">
              {value}
              {isPercentage ? "" : ""}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
