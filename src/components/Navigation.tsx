import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MoonIcon, SunIcon, TrashIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { toast } from "../components/ui/use-toast";

const NavLink = ({ to, children }: any) => (
  <Link
    to={to}
    className="relative text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 group"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-teal-600 transform origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100">
      <span className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-transparent to-white opacity-50 animate-gradient-fade"></span>
    </span>
  </Link>
);

const Logo = () => (
  <svg
    className="w-8 h-8 mr-2"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      className="fill-blue-600 dark:fill-blue-400"
    />
    <path
      d="M2 17L12 22L22 17"
      className="stroke-teal-600 dark:stroke-teal-400"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      className="stroke-blue-600 dark:stroke-blue-400"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Navigation() {
  const { setTheme, theme } = useTheme();

  const clearLocalStorage = () => {
    localStorage.clear();
    toast({
      title: "Localstorage cleared",
      description: "All local data has been removed.",
    });
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text hover:from-blue-500 hover:to-teal-500 transition-all duration-300">
              VerifiEd
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/portal">Training Modules</NavLink>
            <NavLink to="/performance">Performance</NavLink>
            <NavLink to="/skills">Skills</NavLink>
            <Link to="/phc">
              <Button
                variant="outline"
                className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-teal-500 text-white border-none"
              >
                <span className="relative z-10 font-semibold">
                  Get your PHC Now!!
                </span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-teal-600 animate-gradient-x"></span>
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out scale-0 rounded-md group-hover:scale-105 group-hover:bg-white group-hover:opacity-30"></span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearLocalStorage}
              className="hover:bg-red-600 hover:text-white transition-all duration-300 dark:hover:bg-teal-600"
            >
              <TrashIcon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Clear Local Storage</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="transition-all duration-300"
            >
              <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}