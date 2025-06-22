import React from "react";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SystemStatus from "@/components/dashboard/SystemStatus";

const Dashboard: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* System Status - Now at the top */}
        <SystemStatus />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;