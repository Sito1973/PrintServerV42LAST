import React from "react";
import ApiDocsComponent from "@/components/api-docs/ApiDocs";
import { Input } from "@/components/ui/input";

const ApiDocs: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <ApiDocsComponent />
      </div>
    </div>
  );
};

export default ApiDocs;
