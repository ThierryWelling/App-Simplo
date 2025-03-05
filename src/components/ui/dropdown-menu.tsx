import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

type DropdownMenuProps = {
  children: React.ReactNode
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative">{children}</div>
}

type DropdownMenuTriggerProps = {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

const DropdownMenuTrigger = ({ 
  children, 
  asChild = false, 
  className 
}: DropdownMenuTriggerProps) => {
  const childrenWithProps = React.cloneElement(
    React.Children.only(children) as React.ReactElement, 
    { onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      const event = new CustomEvent('dropdown-toggle');
      document.dispatchEvent(event);
    }}
  );
  
  return <>{childrenWithProps}</>;
}

type DropdownMenuContentProps = {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

const DropdownMenuContent = ({ 
  children, 
  align = "center", 
  className 
}: DropdownMenuContentProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    const handleToggle = () => {
      setOpen(prev => !prev);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('dropdown-toggle', handleToggle);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('dropdown-toggle', handleToggle);
    };
  }, []);
  
  if (!open) return null;
  
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }
  
  return (
    <div 
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        alignClasses[align],
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

type DropdownMenuGroupProps = {
  children: React.ReactNode
  className?: string
}

const DropdownMenuGroup = ({ children, className }: DropdownMenuGroupProps) => {
  return <div className={cn("py-1", className)}>{children}</div>
}

type DropdownMenuItemProps = {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const DropdownMenuItem = ({ 
  children, 
  onClick, 
  className 
}: DropdownMenuItemProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        
        // Close dropdown after clicking an item
        const event = new CustomEvent('dropdown-toggle');
        document.dispatchEvent(event);
      }}
      className={cn(
        "text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem
} 