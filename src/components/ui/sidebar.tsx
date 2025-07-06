import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './button';
import { 
  Home, 
  Users, 
  Monitor, 
  Image, 
  Settings, 
  LogOut, 
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    // For exact path matches
    if (pathname === path) {
      return true;
    }
    
    // For Dashboard/Home pages, only match exact paths
    if (path === '/admin' || path === '/store' || path === '/') {
      return pathname === path;
    }
    
    // For other paths, check if current path starts with the item path
    return pathname.startsWith(path + '/');
  };

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: Home },
    { path: '/admin/client', label: 'Client', icon: Users },
    { path: '/admin/media', label: 'Media', icon: Image },
    { path: '/admin/setup', label: 'Setup', icon: Settings },
  ];

  const storeNavItems = [
    { path: '/store', label: 'Displays', icon: Monitor },
  ];

  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/login', label: 'Login', icon: LogOut },
  ];

  const getNavItems = () => {
    if (user?.role === 'admin') return adminNavItems;
    if (user?.role === 'store') return storeNavItems;
    return publicNavItems;
  };

  return (
    <div className={`
      ${isMobile ? 'fixed' : 'static'} 
      ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      ${isMobile ? 'z-50' : 'z-auto'}
      w-64 bg-white border-r border-gray-200 shadow-lg
      transition-transform duration-300 ease-in-out
      flex flex-col h-screen
    `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Digital Signage</h2>
              <p className="text-sm text-gray-500">Management System</p>
            </div>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-2 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`
                  w-full justify-start px-4 py-3 h-auto
                  text-left font-medium transition-all duration-200
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => router.push(item.path)}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* User info and logout */}
      {user && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user.email || user.clientName)?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email || user.clientName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start px-4 py-3 h-auto text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      )}
    </div>
  );
} 