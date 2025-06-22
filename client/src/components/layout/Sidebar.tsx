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
    <div className="w-72 glass-effect border-r border-white/20 h-screen">
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
    </div>
  );
};

// Function to get navigation items based on user role
export const getNavigationItems = (isAdmin: boolean = false) => [
  ...baseNavigationItems,
  ...(isAdmin ? adminNavigationItems : []),
];

export default Sidebar;