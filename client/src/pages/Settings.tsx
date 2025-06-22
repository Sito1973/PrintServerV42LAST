import React from "react";
import { QzTrayCertificate } from "@/components/settings/QzTrayCertificate";
import { QzTrayAuthorization } from "@/components/settings/QzTrayAuthorization";
import Settings from "@/components/settings/Settings";

const SettingsPage: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px:8">
        <div className="space-y-6">
          <Settings />
          <QzTrayAuthorization />
          <QzTrayCertificate />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;