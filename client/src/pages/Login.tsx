import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import Image from "@/components/ui/Image";

const Login: React.FC = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-none">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">PrinterHub</h1>
          <div className="flex items-center justify-center mt-2 mb-2">
            <Image 
              src="/printer-logo.svg" 
              fallbackSrc="/images/printer-logo.svg" 
              alt="Printer Logo" 
              className="h-120 w-40 mx-2" 
            />
          </div>
          <p className="text-sm text-gray-600">
            Sistema de gestión de impresión remota
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;