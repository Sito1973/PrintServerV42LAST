import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Printer, 
  Users, 
  FileText, 
  Code, 
  Settings 
} from "lucide-react";
import Image from "@/components/ui/Image";
import { useAppSettings } from "@/components/AppContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

// Base navigation items - exported for use in other components
export const baseNavigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Printers", href: "/printers", icon: Printer },
  { name: "Print Jobs", href: "/print-jobs", icon: FileText },
  { name: "API Docs", href: "/api-docs", icon: Code },
];

// Admin-only navigation items
export const adminNavigationItems = [
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false }) => {
  const location = useLocation();
  const { settings } = useAppSettings();
  const { username, name, user } = useAuth();

  const navigationItems = [
    ...baseNavigationItems,
    ...(user?.isAdmin ? adminNavigationItems : []),
  ];

  // Function to check if a link is active
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-72 glass-effect border-r border-white/20 h-screen relative">
      <nav className="p-6 space-y-3">
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navegación
          </h2>
        </div>
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group hover-lift",
              isActive(item.href)
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "text-gray-700 hover:bg-white/80 hover:shadow-md"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              isActive(item.href)
                ? "bg-white/20"
                : "bg-gray-100 group-hover:bg-gray-200"
            )}>
              <item.icon className={cn(
                "w-5 h-5",
                isActive(item.href) ? "text-white" : "text-gray-600"
              )} />
            </div>
            <span className="font-medium">{item.name}</span>
            {isActive(item.href) && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </Link>
        ))}
      </nav>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <Users size={18} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {name || username || "Usuario"}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                {username ? `@${username}` : "View profile"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logo debajo del usuario */}
      <div className="p-4 pt-2">
        <style>
          {`
            @keyframes logoAnimation {
              0%, 85% { transform: scale(1); opacity: 0.8; }
              90% { transform: scale(1.1); opacity: 1; }
              95% { transform: scale(1.05); opacity: 0.9; }
              100% { transform: scale(1); opacity: 0.8; }
            }
            .logo-auto-animate {
              animation: logoAnimation 8s infinite;
            }
          `}
        </style>
        <svg 
          id="Capa_2" 
          data-name="Capa 2" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 534.62 87.78"
          className="h-12 w-auto logo-auto-animate hover:opacity-100 hover:scale-110 transition-all duration-300"
        >
          <defs>
            <style>
              {`.cls-1 {
                fill: #2845af;
              }`}
            </style>
          </defs>
          <g id="Capa_1-2" data-name="Capa 1">
            <g>
              <path className="cls-1" d="M100.5,4.28V83.5c0,2.36-1.92,4.28-4.28,4.28h-23.87c-2.36,0-4.28-1.92-4.28-4.28v-20l13.56-32.94c.9-2.19-.14-4.69-2.33-5.59h0c-2.19-.9-4.68,.14-5.58,2.33l-14.21,34.5v21.7c0,2.36-1.92,4.28-4.28,4.28H4.28c-2.36,0-4.28-1.92-4.28-4.28V4.28C0,1.92,1.92,0,4.28,0H23.46c2.36,0,4.28,1.92,4.28,4.28l-1.43,68.45c-.06,2.96,4,3.86,5.19,1.15L63.01,2.51c.69-1.53,2.22-2.51,3.9-2.51h29.32c2.36,0,4.28,1.92,4.28,4.28Z"/>
              <g>
                <rect className="cls-1" x="137.79" y=".63" width="19.11" height="87.15"/>
                <path className="cls-1" d="M226.71,.63h-.11c-6.61,0-12.3,3.28-15.61,9.01l-45.11,78.14h22.06L226.65,20.73l38.71,67.05h22.06L242.32,9.64c-3.31-5.73-9-9.01-15.61-9.01Z"/>
                <path className="cls-1" d="M292.95,27.2c0,14.65,11.92,26.56,26.56,26.56h61.06c4.11,0,7.46,3.35,7.46,7.46s-3.35,7.46-7.46,7.46h-87.62v19.11h87.62c14.65,0,26.56-11.92,26.56-26.56s-11.92-26.56-26.56-26.56h-61.06c-4.11,0-7.46-3.35-7.46-7.46s3.35-7.46,7.46-7.46h87.62V.63h-87.62c-14.65,0-26.56,11.92-26.56,26.56Z"/>
                <path className="cls-1" d="M447,19.74h87.62V.63h-87.62c-14.65,0-26.56,11.92-26.56,26.56,0,14.65,11.92,26.56,26.56,26.56h61.06c4.11,0,7.46,3.35,7.46,7.46s-3.35,7.46-7.46,7.46h-87.62v19.11h87.62c14.65,0,26.56-11.92,26.56-26.56s-11.92-26.56-26.56-26.56h-61.06c-4.11,0-7.46-3.35-7.46-7.46s3.35-7.46,7.46-7.46Z"/>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

// Function to get navigation items based on user role
export const getNavigationItems = (isAdmin: boolean = false) => [
  ...baseNavigationItems,
  ...(isAdmin ? adminNavigationItems : []),
];

export default Sidebar;