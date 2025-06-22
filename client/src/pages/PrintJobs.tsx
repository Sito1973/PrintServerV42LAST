import React from "react";
import PrintJobsList from "@/components/print-jobs/PrintJobsList";
import SubmitPrintJobForm from "@/components/print-jobs/SubmitPrintJobForm";
import PrintJobMonitor from "@/components/print-jobs/PrintJobMonitor";
import RealTimePrintStatus from "@/components/print-jobs/RealTimePrintStatus";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Code } from "lucide-react";

const PrintJobs: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Print Jobs</h3>
          <div className="mt-3 sm:mt-0 sm:flex space-x-3">
            <Button className="flex items-center gap-2" variant="outline" asChild>
              <Link href="/api-docs">
                <Code size={16} />
                API Documentation
              </Link>
            </Button>

            <SubmitPrintJobForm />
          </div>
        </div>

        <div className="space-y-6">
          <RealTimePrintStatus />
          <PrintJobMonitor />
          <PrintJobsList />
        </div>
      </div>
    </div>
  );
};

export default PrintJobs;