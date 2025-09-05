import React, { createContext, useContext, useState } from "react";
import { cn } from "@/utils";

const SidebarContext = createContext();

const SidebarProvider = ({ children, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="flex h-screen w-full" {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const Sidebar = React.forwardRef(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}
      {...props}
    />
  );
});

Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));

SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-2", className)}
    {...props}
  />
));

SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));

SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
    {...props}
  />
));

SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
    {...props}
  />
));

SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full text-sm", className)}
    {...props}
  />
));

SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
));

SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
));

SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "div" : "button";
  
  return (
    <Comp
      ref={ref}
      className={cn(
        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
});

SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { setIsOpen } = useSidebar();
  
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen(prev => !prev)}
      {...props}
    />
  );
});

SidebarTrigger.displayName = "SidebarTrigger";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
