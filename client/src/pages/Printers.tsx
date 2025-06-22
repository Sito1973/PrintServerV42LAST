import React, { useState } from "react";
import PrinterList from "@/components/printers/PrinterList";
import AddPrinterForm from "@/components/printers/AddPrinterForm";
import PrinterDetector from "@/components/printers/PrinterDetector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const Printers: React.FC = () => {
  const [activeTab, setActiveTab] = useState("list");
  const isMobile = useIsMobile();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Impresoras</h3>
          {!isMobile && (
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <AddPrinterForm />
            </div>
          )}
        </div>
        
        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="detector">Detector Automático</TabsTrigger>
            {isMobile && <TabsTrigger value="add">Agregar</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="list" className="mt-6">
            <PrinterList />
          </TabsContent>
          
          <TabsContent value="detector" className="mt-6">
            <PrinterDetector />
          </TabsContent>
          
          {isMobile && (
            <TabsContent value="add" className="mt-6">
              <div className="mb-6">
                <AddPrinterForm />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Printers;
