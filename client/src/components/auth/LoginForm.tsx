import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, Printer } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Por favor ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  onSuccess?: (apiKey: string, username?: string, name?: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { setApiKey } = useAuth();
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest({
        url: "/api/login",
        method: "POST",
        body: data,
        requireAuth: false,
      });

      return response;
    },
    onSuccess: (data) => {
      console.log("Login successful, received data:", {
        apiKey: data.apiKey ? "Received" : "Missing",
        username: data.username || "Missing",
        name: data.name || "Missing"
      });

      // Use AuthProvider to set authentication state
      setApiKey(data.apiKey, data.username, data.name);
      setLocalApiKey(data.apiKey);

      // Verify the API key was stored
      const storedKey = localStorage.getItem("api_key");
      console.log("Login: API key verification in localStorage:", storedKey ? "Success" : "Failed");

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });

      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        console.log("Login: Calling onSuccess callback");
        navigate("/dashboard");
        if (onSuccess) {
          onSuccess(data.apiKey, data.username, data.name);
        }
      }, 200);
    },
    onError: (error) => {
      toast({
        title: "Error de autenticación",
        description:
          error instanceof Error
            ? error.message
            : "Credenciales incorrectas",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 lg:py-0">
        <div className="w-full max-w-lg space-y-6">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
              <Printer className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido a PrinterHub
            </h1>
            <p className="text-sm text-gray-600">
              Inicia sesión con tu cuenta para continuar
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Correo electrónico
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10 h-11 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </Form>

          {localApiKey && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm font-medium text-green-800 mb-2">
                  ¡Autenticación exitosa!
                </p>
                <p className="text-xs text-green-600">
                  Tu sesión ha sido iniciada correctamente.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Sistema de gestión de impresoras seguro y confiable
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-8 lg:p-12">
          <div className="max-w-md">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Printer className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Gestión Inteligente
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Controla todas tus impresoras desde un solo lugar. Monitoreo en tiempo real, gestión de trabajos de impresión y administración centralizada.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Monitoreo en tiempo real</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Gestión remota de impresoras</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Administración centralizada</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Control de acceso seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default LoginForm;